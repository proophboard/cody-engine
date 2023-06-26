export const addImport = (newImport: string, imports: string[]): string[] => {
  if(!imports.includes(newImport)) {
    return [...imports, newImport];
  }

  return imports;
}
