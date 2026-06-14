export type MiscellaneousEntry = {
  id: string;
  title: string;
  category: string;
  relatedSong: string;
  body: string;
  notes: string;
  tags: string;
  lyricLink: string;
  storyLink: string;
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