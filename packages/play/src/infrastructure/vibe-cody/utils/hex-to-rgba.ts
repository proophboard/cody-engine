export const hexToRGBA = (hex: string, opacity?: string): string => {
  if(!opacity) {
    opacity = '1';
  }
  // Convert each hex character pair into an integer
  let red = parseInt(hex.substring(1, 3), 16);
  let green = parseInt(hex.substring(3, 5), 16);
  let blue = parseInt(hex.substring(5, 7), 16);

  // Concatenate these codes into proper RGBA format
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`
}
