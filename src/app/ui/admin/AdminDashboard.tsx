"use client";

import { useState } from "react";
import { BrotherOverviewField, RecruitOverviewField } from "@/app/lib/definitions";
import BrothersTable from "./BrothersTable";
import RecruitsTable from "./RecruitsTable";

interface AdminDashboardProps {
  brothers: BrotherOverviewField[];
  recruits: RecruitOverviewField[];
  adminId: string;
}

export default function AdminDashboard({ brothers, recruits, adminId }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"brothers" | "recruits">("brothers");

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("brothers")}
            className={`${
              activeTab === "brothers"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Brothers ({brothers.length})
          </button>
          <button
            onClick={() => setActiveTab("recruits")}
            className={`${
              activeTab === "recruits"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Recruits ({recruits.length})
          </button>
        </nav>
      </div>

      {activeTab === "brothers" ? (
        <BrothersTable brothers={brothers} adminId={adminId} />
      ) : (
        <RecruitsTable recruits={recruits} adminId={adminId} />
      )}
    </div>
  );
}
