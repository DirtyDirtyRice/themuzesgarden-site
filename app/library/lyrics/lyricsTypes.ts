export type LyricEntry = {
  id: string;
  title: string;
  artist: string;
  tags: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type DirectoryPickerWindow = Window &
  typeof globalThis & {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  };