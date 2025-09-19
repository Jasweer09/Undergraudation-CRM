export type Status = 'Shortlisting' | 'Applying' | 'Applied' | 'Selected';
export type Student = {
  id: string;
  name: string;
  email: string;
  country: string;
  status: Status;
  lastActive: string;
};

export const STUDENTS: Student[] = [
  {
    id: 's1',
    name: 'Aisha Khan',
    email: 'aisha.khan@example.com',
    country: 'India',
    status: 'Shortlisting',
    lastActive: '2025-09-08T10:20:00.000Z'
  },
  {
    id: 's2',
    name: "Liam O'Connor",
    email: 'liam.oconnor@example.com',
    country: 'Ireland',
    status: 'Applying',
    lastActive: '2025-08-29T15:00:00.000Z'
  },
  {
    id: 's3',
    name: 'Chen Wei',
    email: 'chen.wei@example.com',
    country: 'China',
    status: 'Applied',
    lastActive: '2025-09-12T09:10:00.000Z'
  },
  {
    id: 's4',
    name: 'Maria Silva',
    email: 'maria.silva@example.com',
    country: 'Brazil',
    status: 'Selected',
    lastActive: '2025-09-14T12:45:00.000Z'
  }
];
