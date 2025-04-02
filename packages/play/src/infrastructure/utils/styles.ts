export const Palette = {
  cColor: (color: string) => `color: ${color};background-color: #3b3b3b;padding: 5px;`,
  cColorBold: (color: string) => `color: ${color};font-weight: bold;background-color: #3b3b3b;padding: 5px`,
  common: {
    grey: '#919191',
  },
  stickyColors: {
    event: '#FF9F4B',
    command: '#26C0E7',
    role: '#f7f727',
    projection: '#3acbc0',
    aggregate: '#F5E339',
    document: '#73dd8e',
    policy: '#EABFF1',
    hotSpot: '#f31d30',
    externalSystem: '#ec98ac',
    ui: '#000000',
    feature: '#cfcfcf',
    boundedContext: '#a2a2a2',
    edge: '#414141',
    textCard: '#ffdfd3'
  }
};
