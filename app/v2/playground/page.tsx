"use client";

import { useState } from "react";
import {
  PrimaryButton,
  SecondaryButton,
  CyanButton,
  PanelCard,
  TextInput,
  ChipToggle,
  FilterChipsRow,
  TopBar,
  IkidoLogo,
  PointsPill,
} from "@/components/ikido";
import { Check, Clock, Star } from "lucide-react";

/**
 * UI Kit Playground
 * Use this page to validate and test iKidO components
 * Route: /v2/playground
 */
export default function PlaygroundPage() {
  const [inputValue, setInputValue] = useState("");
  const [chipValue, setChipValue] = useState("All");
  const [filterValue, setFilterValue] = useState("all");

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <TopBar
        showBack
        onBack={() => window.history.back()}
        showLogout
        onLogout={handleLogout}
        coins={1250}
      />

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-[var(--ik-accent-yellow)] mb-2">
            UI Kit Playground
          </h1>
          <p className="text-[var(--ik-text-muted)]">
            Test and validate iKidO components
          </p>
        </div>

        {/* Logo Variants */}
        <PanelCard>
          <h2 className="text-lg font-bold text-white mb-4">Logo Variants</h2>
          <div className="flex flex-wrap items-center gap-4">
            <IkidoLogo size="small" />
            <IkidoLogo size="default" />
            <IkidoLogo size="large" />
          </div>
        </PanelCard>

        {/* Points Pills */}
        <PanelCard>
          <h2 className="text-lg font-bold text-white mb-4">Points Pills</h2>
          <div className="flex flex-wrap items-center gap-4">
            <PointsPill points={100} size="small" />
            <PointsPill points={1250} size="default" />
            <PointsPill points={9999} />
          </div>
        </PanelCard>

        {/* Buttons */}
        <PanelCard>
          <h2 className="text-lg font-bold text-white mb-4">Buttons</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <PrimaryButton size="sm">Small</PrimaryButton>
              <PrimaryButton>Medium</PrimaryButton>
              <PrimaryButton size="lg">Large</PrimaryButton>
            </div>
            <div className="flex flex-wrap gap-3">
              <SecondaryButton>Secondary</SecondaryButton>
              <CyanButton>Cyan</CyanButton>
            </div>
            <div className="flex flex-wrap gap-3">
              <PrimaryButton icon={<Star className="w-4 h-4" />}>
                With Icon
              </PrimaryButton>
              <PrimaryButton loading>Loading</PrimaryButton>
              <PrimaryButton disabled>Disabled</PrimaryButton>
            </div>
            <div>
              <PrimaryButton fullWidth>Full Width Button</PrimaryButton>
            </div>
          </div>
        </PanelCard>

        {/* Inputs */}
        <PanelCard>
          <h2 className="text-lg font-bold text-white mb-4">Text Inputs</h2>
          <div className="space-y-4">
            <TextInput
              label="Email"
              placeholder="Enter your email"
              value={inputValue}
              onChange={setInputValue}
              helper="We'll never share your email"
            />
            <TextInput
              label="Password"
              type="password"
              placeholder="Enter password"
            />
            <TextInput
              label="With Error"
              placeholder="Something wrong"
              error="This field is required"
            />
          </div>
        </PanelCard>

        {/* Chips */}
        <PanelCard>
          <h2 className="text-lg font-bold text-white mb-4">Chip Toggles</h2>
          <div className="space-y-4">
            <div>
              <p className="text-[var(--ik-text-muted)] text-sm mb-2">
                Simple chips:
              </p>
              <ChipToggle
                options={["All", "Pending", "Completed"]}
                value={chipValue}
                onChange={setChipValue}
              />
            </div>
            <div>
              <p className="text-[var(--ik-text-muted)] text-sm mb-2">
                Filter chips with icons:
              </p>
              <FilterChipsRow
                filters={[
                  { id: "all", label: "All" },
                  { id: "completed", label: "Completed", icon: <Check className="w-3 h-3" /> },
                  { id: "pending", label: "Pending", icon: <Clock className="w-3 h-3" /> },
                ]}
                activeFilter={filterValue}
                onFilterChange={setFilterValue}
              />
            </div>
          </div>
        </PanelCard>

        {/* Panel Variants */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Panel Variants</h2>
          <PanelCard variant="default">
            <p className="text-white">Default Panel</p>
          </PanelCard>
          <PanelCard variant="light">
            <p className="text-white">Light Panel</p>
          </PanelCard>
          <PanelCard variant="highlight">
            <p className="text-white">Highlight Panel (gold border)</p>
          </PanelCard>
        </div>

        {/* Status Colors */}
        <PanelCard>
          <h2 className="text-lg font-bold text-white mb-4">Status Colors</h2>
          <div className="flex flex-wrap gap-4">
            <span className="text-[var(--ik-success)] font-bold">Success</span>
            <span className="text-[var(--ik-warning)] font-bold">Warning</span>
            <span className="text-[var(--ik-danger)] font-bold">Danger</span>
            <span className="text-[var(--ik-accent-yellow)] font-bold">
              Accent Yellow
            </span>
            <span className="text-[var(--ik-accent-cyan)] font-bold">
              Accent Cyan
            </span>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
