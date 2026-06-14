export type MultiStemEntry = {
  id: string;
  title: string;
  songTitle: string;
  bpm: string;
  songKey: string;
  stemTypes: string;
  sourceFolder: string;
  notes: string;
  tags: string;
  trackLink: string;
  projectLink: string;
  metadataLink: string;
  createdAt: string;
  updatedAt: string;
};

export type DirectoryPickerWindow = Window &
  typeof globalThis & {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  };