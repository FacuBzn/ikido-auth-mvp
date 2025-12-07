/**
 * Script de test para validar inserción de children
 * 
 * Ejecutar con: npx tsx scripts/test-insert-child.ts
 * 
 * Requiere:
 * - Variables de entorno configuradas (.env.local)
 * - Parent autenticado en Supabase
 * - Migraciones ejecutadas en Supabase
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar configurados");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsertChild() {
  console.log("🧪 Iniciando test de inserción de child...\n");

  try {
    // 1. Obtener sesión actual (debe estar autenticado como parent)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error("❌ Error: No hay sesión activa. Por favor, inicia sesión como parent primero.");
      console.error("   Usa: supabase.auth.signInWithPassword() o inicia sesión en la app");
      process.exit(1);
    }

    console.log("✅ Sesión activa encontrada");
    console.log(`   User ID: ${session.user.id}`);
    console.log(`   Email: ${session.user.email}\n`);

    // 2. Obtener parent row completo
    const { data: parentRow, error: parentError } = await supabase
      .from("users")
      .select("id, child_code, role")
      .eq("auth_id", session.user.id)
      .eq("role", "parent")
      .maybeSingle();

    if (parentError || !parentRow) {
      console.error("❌ Error al cargar parent:", parentError);
      process.exit(1);
    }

    if (!parentRow.child_code) {
      console.error("❌ Error: Parent no tiene child_code (family_code)");
      process.exit(1);
    }

    console.log("✅ Parent cargado correctamente");
    console.log(`   Parent ID: ${parentRow.id}`);
    console.log(`   Family Code: ${parentRow.child_code}\n`);

    // 3. Generar child_code único
    const generateChildCode = (name: string, randomSuffix: number): string => {
      const normalizedName = name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 10) || "CHILD";
      return `${normalizedName}#${randomSuffix}`;
    };

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const childCode = generateChildCode("TEST", randomSuffix);
    const childId = crypto.randomUUID();

    console.log("📝 Preparando inserción de child...");
    console.log(`   Child ID: ${childId}`);
    console.log(`   Child Code: ${childCode}`);
    console.log(`   Family Code: ${parentRow.child_code}`);
    console.log(`   Name: Test Child\n`);

    // 4. Intentar insertar child
    const { data: insertedChild, error: insertError } = await supabase
      .from("users")
      .insert({
        id: childId,
        auth_id: null,
        email: null,
        name: "Test Child",
        role: "child",
        parent_id: parentRow.id,
        family_code: parentRow.child_code,
        child_code: childCode,
        points_balance: 0,
      } as any)
      .select("id, name, child_code, family_code, parent_id, created_at")
      .maybeSingle();

    if (insertError) {
      console.error("❌ Error al insertar child:");
      console.error(`   Code: ${insertError.code}`);
      console.error(`   Message: ${insertError.message}`);
      console.error(`   Details: ${insertError.details || "N/A"}`);
      console.error(`   Hint: ${insertError.hint || "N/A"}`);

      if (insertError.code === "42501") {
        console.error("\n⚠️  Error 42501: Permiso insuficiente (RLS bloqueó la inserción)");
        console.error("   Verifica que las políticas RLS estén correctamente configuradas.");
        console.error("   Ejecuta: scripts/sql/08-rls-policy-parent-insert-child.sql");
      }

      process.exit(1);
    }

    if (!insertedChild) {
      console.error("❌ Error: Child no fue insertado pero no hay error");
      process.exit(1);
    }

    console.log("✅ Child insertado exitosamente!");
    console.log("\n📊 Datos del child insertado:");
    console.log(`   ID: ${insertedChild.id}`);
    console.log(`   Name: ${insertedChild.name}`);
    console.log(`   Child Code: ${insertedChild.child_code}`);
    console.log(`   Family Code: ${insertedChild.family_code}`);
    console.log(`   Parent ID: ${insertedChild.parent_id}`);
    console.log(`   Created At: ${insertedChild.created_at}\n`);

    // 5. Verificar que el child puede ser leído por el parent
    const { data: readChild, error: readError } = await supabase
      .from("users")
      .select("id, name, child_code, family_code")
      .eq("id", insertedChild.id)
      .maybeSingle();

    if (readError || !readChild) {
      console.error("⚠️  Warning: No se pudo leer el child después de insertarlo");
      console.error("   Esto puede indicar un problema con las políticas RLS de SELECT");
    } else {
      console.log("✅ Child puede ser leído correctamente por el parent");
    }

    // 6. Limpiar: eliminar child de test
    console.log("\n🧹 Limpiando child de test...");
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", insertedChild.id);

    if (deleteError) {
      console.error("⚠️  Warning: No se pudo eliminar el child de test");
      console.error(`   Child ID: ${insertedChild.id}`);
      console.error("   Elimínalo manualmente si es necesario");
    } else {
      console.log("✅ Child de test eliminado correctamente");
    }

    console.log("\n🎉 Test completado exitosamente!");
    console.log("   El endpoint /api/children/create debería funcionar correctamente.");

  } catch (error) {
    console.error("❌ Error inesperado:", error);
    process.exit(1);
  }
}

testInsertChild();

