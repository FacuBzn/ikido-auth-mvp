/**
 * POST /api/parent/tasks/custom-create-and-assign
 *
 * Creates a custom task template and assigns it to a child in one atomic operation.
 * Body: { childId: string, title: string, points: number, description?: string }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/serverClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";

export const dynamic = "force-dynamic";

interface RequestBody {
  childId?: string;
  title?: string;
  points?: number;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate parent
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    if (authUser.profile.role !== "Parent") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only parents can create tasks" },
        { status: 403 }
      );
    }

    // Step 2: Parse and validate body
    const body: RequestBody = await request.json();

    if (!body.childId || typeof body.childId !== "string") {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "childId is required" },
        { status: 400 }
      );
    }

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "title is required" },
        { status: 400 }
      );
    }

    if (
      body.points === undefined ||
      typeof body.points !== "number" ||
      isNaN(body.points) ||
      body.points < 1 ||
      body.points > 100
    ) {
      return NextResponse.json(
        {
          error: "INVALID_POINTS",
          message: "points must be a number between 1 and 100",
        },
        { status: 400 }
      );
    }

    const { supabase } = createSupabaseRouteHandlerClient(request);

    // Step 3: Get parent internal ID from auth_id
    const { data: parentData, error: parentError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authUser.user.id)
      .eq("role", "parent")
      .single();

    if (parentError || !parentData) {
      console.error(
        "[custom-create-and-assign] Parent not found:",
        parentError
      );
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Parent not found" },
        { status: 403 }
      );
    }

    const parentId = parentData.id;

    // Step 4: Verify child belongs to this parent
    const { data: childData, error: childError } = await supabase
      .from("users")
      .select("id, name")
      .eq("id", body.childId)
      .eq("role", "child")
      .eq("parent_id", parentId)
      .single();

    if (childError || !childData) {
      console.error(
        "[custom-create-and-assign] Child not found or not owned:",
        childError
      );
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "Child not found or does not belong to this parent",
        },
        { status: 403 }
      );
    }

    // Step 5: Create custom task template
    const { data: taskTemplate, error: templateError } = await supabase
      .from("tasks")
      .insert({
        title: body.title.trim(),
        description: body.description?.trim() || null,
        points: body.points,
        is_global: false,
        created_by_parent_id: parentId,
      })
      .select()
      .single();

    if (templateError || !taskTemplate) {
      console.error(
        "[custom-create-and-assign] Failed to create task template:",
        templateError
      );
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to create task template" },
        { status: 500 }
      );
    }

    console.log("[custom-create-and-assign] Task template created:", {
      taskId: taskTemplate.id,
      title: taskTemplate.title,
      points: taskTemplate.points,
    });

    // Step 6: Assign task to child
    const { data: childTask, error: assignError } = await supabase
      .from("child_tasks")
      .insert({
        task_id: taskTemplate.id,
        child_id: body.childId,
        parent_id: parentId,
        status: "pending",
        points: taskTemplate.points,
      })
      .select()
      .single();

    if (assignError || !childTask) {
      console.error(
        "[custom-create-and-assign] Failed to assign task:",
        assignError
      );

      // Rollback: delete the task template we just created
      await supabase.from("tasks").delete().eq("id", taskTemplate.id);

      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to assign task to child" },
        { status: 500 }
      );
    }

    console.log("[custom-create-and-assign] Task assigned:", {
      childTaskId: childTask.id,
      childId: body.childId,
      childName: childData.name,
    });

    return NextResponse.json(
      {
        success: true,
        task: taskTemplate,
        childTask: childTask,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[custom-create-and-assign] Unexpected error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
