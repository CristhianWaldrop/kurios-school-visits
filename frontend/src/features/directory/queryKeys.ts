export const directoryKeys = {
  schools: ['schools'] as const,
  specialists: ['specialists'] as const,
  teachers: (schoolId: number | undefined) => ['teachers', schoolId] as const,
}
