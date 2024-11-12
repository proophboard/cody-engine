export const fqcnToViewName = (fqcn: string, defaultService: string): string => {
  const parts = fqcn.split(".");

  if(parts.length === 0) {
    return '';
  }

  if(parts.length === 1) {
    return `${defaultService}.${parts[0]}`;
  }

  const lastPart = parts.pop();

  return `${parts[0]}.${lastPart}`;
}
