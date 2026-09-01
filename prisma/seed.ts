import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const features = [
  {
    name: 'Team Management',
    key: 'team_management',
    description: 'Manage team-level settings and access.',
    permissions: [
      {
        name: 'View Team',
        key: 'team:view',
        description: 'View team information.',
      },
      {
        name: 'Update Team',
        key: 'team:update',
        description: 'Update team information.',
      },
      {
        name: 'Delete Team',
        key: 'team:delete',
        description: 'Delete the team.',
      },
    ],
  },

  {
    name: 'Member Management',
    key: 'member_management',
    description: 'Manage team members.',
    permissions: [
      {
        name: 'View Members',
        key: 'member:view',
        description: 'View team members.',
      },
      {
        name: 'Add Member',
        key: 'member:add',
        description: 'Add members to the team.',
      },
      {
        name: 'Update Member',
        key: 'member:update',
        description: 'Update member information or role.',
      },
      {
        name: 'Remove Member',
        key: 'member:remove',
        description: 'Remove a member from the team.',
      },
    ],
  },

  {
    name: 'Invitation Management',
    key: 'invitation_management',
    description: 'Manage team invitations.',
    permissions: [
      {
        name: 'View Invitations',
        key: 'invitation:view',
        description: 'View team invitations.',
      },
      {
        name: 'Create Invitation',
        key: 'invitation:create',
        description: 'Send invitations to users.',
      },
      {
        name: 'Resend Invitation',
        key: 'invitation:resend',
        description: 'Resend a pending invitation.',
      },
      {
        name: 'Cancel Invitation',
        key: 'invitation:cancel',
        description: 'Cancel a pending invitation.',
      },
    ],
  },

  {
    name: 'Task Group Management',
    key: 'task_group_management',
    description: 'Manage task groups within a team.',
    permissions: [
      {
        name: 'View Task Groups',
        key: 'task_group:view',
        description: 'View task groups.',
      },
      {
        name: 'Create Task Group',
        key: 'task_group:create',
        description: 'Create task groups.',
      },
      {
        name: 'Update Task Group',
        key: 'task_group:update',
        description: 'Update task groups.',
      },
      {
        name: 'Delete Task Group',
        key: 'task_group:delete',
        description: 'Delete task groups.',
      },
    ],
  },

  {
    name: 'Task Management',
    key: 'task_management',
    description: 'Manage tasks within task groups.',
    permissions: [
      {
        name: 'View Tasks',
        key: 'task:view',
        description: 'View tasks.',
      },
      {
        name: 'Create Task',
        key: 'task:create',
        description: 'Create tasks.',
      },
      {
        name: 'Update Task',
        key: 'task:update',
        description: 'Update tasks.',
      },
      {
        name: 'Delete Task',
        key: 'task:delete',
        description: 'Delete tasks.',
      },
      {
        name: 'Assign Task',
        key: 'task:assign',
        description: 'Assign tasks to users.',
      },
    ],
  },

  {
    name: 'Comment Management',
    key: 'comment_management',
    description: 'Manage task comments.',
    permissions: [
      {
        name: 'View Comments',
        key: 'comment:view',
        description: 'View comments.',
      },
      {
        name: 'Create Comment',
        key: 'comment:create',
        description: 'Create comments.',
      },
      {
        name: 'Update Comment',
        key: 'comment:update',
        description: 'Update comments.',
      },
      {
        name: 'Delete Comment',
        key: 'comment:delete',
        description: 'Delete comments.',
      },
    ],
  },
];

async function main() {
  for (const featureData of features) {
    const { permissions, ...feature } = featureData;

    const createdFeature = await prisma.feature.upsert({
      where: {
        key: feature.key,
      },
      update: {
        name: feature.name,
        description: feature.description,
      },
      create: feature,
    });

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: {
          key: permission.key,
        },
        update: {
          name: permission.name,
          description: permission.description,
          featureId: createdFeature.id,
        },
        create: {
          ...permission,
          featureId: createdFeature.id,
        },
      });
    }
  }

  console.log('RBAC features and permissions seeded successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });