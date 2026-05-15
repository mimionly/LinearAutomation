import { internalAction } from "./_generated/server";

type Member = {
  name: string;
  displayName: string;
  email: string;
  createdAt: string;
  lastSeen: string | null;
  admin: boolean;
  initials: string;
  avatarUrl: string;
};

type Team = {
  name: string;
  members: {
    nodes: Member[];
  };
};

export const getmembers = internalAction({
  handler: async () => {
    const res = await fetch(
      "https://api.linear.app/graphql",
      {
        method: "POST",
        headers: {
          Authorization:
        process.env.LINEAR_API_KEY!,
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          query: `
            query Members {
              organization {
                teams {
                  nodes {
                    name
                    members {
                      nodes {
                        name
                        displayName
                        email
                        createdAt
                        statusLabel
                        admin
                        initials
                        avatarUrl
                      }
                    }
                  }
                }
              }
            }
          `,
        }),
      }
    );

    const data = await res.json();

    const teams: Team[] =
      data.data.organization.teams.nodes;

    return teams.flatMap(
      (team: Team) =>
        team.members.nodes.map(
          (member: Member) => ({
            ...member,
            team: team.name,
          })
        )
    );
  },
});