export type StoryEntry = {
  id: string;
  title: string;
  songTitle: string;
  inspiration: string;
  body: string;
  notes: string;
  tags: string;
  lyricLink: string;
  trackLink: string;
  metadataLink: string;
  createdAt: string;
  updatedAt: string;
};

export type DirectoryPickerWindow = Window &
  typeof globalThis & {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  };