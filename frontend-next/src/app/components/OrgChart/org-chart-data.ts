import { OrgChartData } from "./org-chart-types/org-chart-model";

export const initialOrgData: OrgChartData = {
  organizationName: "Corporate Organization",
  description: "Organizational hierarchy with roles and reporting structure",
  hierarchy: [
    {
      id: "ceo",
      role: "CEO",
      name: "Sebastian Bennett",
      children: [
        {
          id: "director1",
          role: "DIRECTOR",
          name: "Alfredo Torres",
          children: [
            {
              id: "manager1",
              role: "MANAGER",
              name: "Phyllis Schwaiger",
              children: [
                {
                  id: "worker1",
                  role: "WORKER",
                  name: "Matt Zhang",
                  children: [
                    {
                      id: "intern1",
                      role: "INTERN",
                      name: "Murad Naser",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "finance",
          role: "FINANCE",
          name: "Donna Stroupe",
          children: [
            {
              id: "manager2",
              role: "MANAGER",
              name: "Bailey Dupont",
              children: [
                {
                  id: "worker2",
                  role: "WORKER",
                  name: "Samira Hadid",
                  children: [
                    {
                      id: "intern2",
                      role: "INTERN",
                      name: "Howard Ong",
                    },
                  ],
                },
                {
                  id: "worker3",
                  role: "WORKER",
                  name: "Richard Sanchez",
                  children: [
                    {
                      id: "intern3",
                      role: "INTERN",
                      name: "Chiaki Sato",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "marketing",
          role: "MARKETING",
          name: "Juliana Silva",
          children: [
            {
              id: "manager3",
              role: "MANAGER",
              name: "Francois Mercer",
              children: [
                {
                  id: "worker4",
                  role: "WORKER",
                  name: "Kyrie Petrakis",
                  children: [
                    {
                      id: "intern4",
                      role: "INTERN",
                      name: "Dani Martinez",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
