import { OrgChartData } from "./org-chart-types/org-chart-model";

export const initialOrgData: OrgChartData = {
  organizationName: "Corporate Organization",
  description:
    "Complex organizational hierarchy with multiple departments and reporting structures",
  hierarchy: [
    {
      id: "ceo",
      role: "CEO",
      name: "Sebastian Bennett",
      children: [
        {
          id: "cto",
          role: "CTO",
          name: "Alfredo Torres",
          children: [
            {
              id: "eng-manager1",
              role: "ENG MANAGER",
              name: "Phyllis Schwaiger",
              children: [
                {
                  id: "senior-dev1",
                  role: "SENIOR DEV",
                  name: "Matt Zhang",
                  children: [
                    {
                      id: "dev1",
                      role: "DEVELOPER",
                      name: "Murad Naser",
                    },
                    {
                      id: "dev2",
                      role: "DEVELOPER",
                      name: "Sarah Johnson",
                    },
                  ],
                },
                {
                  id: "senior-dev2",
                  role: "SENIOR DEV",
                  name: "Alex Chen",
                  children: [
                    {
                      id: "dev3",
                      role: "DEVELOPER",
                      name: "Emily Davis",
                    },
                  ],
                },
              ],
            },
            {
              id: "eng-manager2",
              role: "ENG MANAGER",
              name: "Michael Brown",
              children: [
                {
                  id: "senior-dev3",
                  role: "SENIOR DEV",
                  name: "Lisa Wang",
                },
              ],
            },
          ],
        },
        {
          id: "cfo",
          role: "CFO",
          name: "Donna Stroupe",
          children: [
            {
              id: "finance-manager",
              role: "FINANCE MANAGER",
              name: "Bailey Dupont",
              children: [
                {
                  id: "accountant1",
                  role: "ACCOUNTANT",
                  name: "Samira Hadid",
                  children: [
                    {
                      id: "intern1",
                      role: "INTERN",
                      name: "Howard Ong",
                    },
                  ],
                },
                {
                  id: "accountant2",
                  role: "ACCOUNTANT",
                  name: "Richard Sanchez",
                  children: [
                    {
                      id: "intern2",
                      role: "INTERN",
                      name: "Chiaki Sato",
                    },
                  ],
                },
              ],
            },
            {
              id: "hr-manager",
              role: "HR MANAGER",
              name: "Jennifer Lee",
              children: [
                {
                  id: "hr-specialist1",
                  role: "HR SPECIALIST",
                  name: "David Kim",
                },
                {
                  id: "hr-specialist2",
                  role: "HR SPECIALIST",
                  name: "Maria Garcia",
                },
              ],
            },
          ],
        },
        {
          id: "cmo",
          role: "CMO",
          name: "Juliana Silva",
          children: [
            {
              id: "marketing-manager",
              role: "MARKETING MANAGER",
              name: "Francois Mercer",
              children: [
                {
                  id: "marketing-specialist1",
                  role: "MARKETING SPECIALIST",
                  name: "Kyrie Petrakis",
                  children: [
                    {
                      id: "intern3",
                      role: "INTERN",
                      name: "Dani Martinez",
                    },
                  ],
                },
                {
                  id: "marketing-specialist2",
                  role: "MARKETING SPECIALIST",
                  name: "Robert Taylor",
                },
              ],
            },
            {
              id: "sales-manager",
              role: "SALES MANAGER",
              name: "Patricia Williams",
              children: [
                {
                  id: "sales-rep1",
                  role: "SALES REP",
                  name: "James Anderson",
                },
                {
                  id: "sales-rep2",
                  role: "SALES REP",
                  name: "Linda Thompson",
                },
                {
                  id: "sales-rep3",
                  role: "SALES REP",
                  name: "Christopher Moore",
                },
              ],
            },
          ],
        },
        {
          id: "coo",
          role: "COO",
          name: "Thomas White",
          children: [
            {
              id: "ops-manager",
              role: "OPS MANAGER",
              name: "Nancy Harris",
              children: [
                {
                  id: "ops-coordinator1",
                  role: "OPS COORDINATOR",
                  name: "Daniel Martinez",
                },
                {
                  id: "ops-coordinator2",
                  role: "OPS COORDINATOR",
                  name: "Karen Clark",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
