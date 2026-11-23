export const directoryKeys = {
  schools: ['schools'] as const,
  teachers: (schoolId: number | undefined) => ['teachers', schoolId] as const,
}
