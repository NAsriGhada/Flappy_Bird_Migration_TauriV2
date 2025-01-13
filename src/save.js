import {
  BaseDirectory,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";

function makeSaveSystem(savefileName) {
  return {
    data: {},
    async save() {
      await writeTextFile(savefileName, JSON.stringify(this.data), {
        baseDir: BaseDirectory.AppLocalData,
      });
    },
    async load() {
      try {
        this.data = JSON.parse(
          await readTextFile(savefileName, {
            baseDir: BaseDirectory.AppLocalData,
          })
        );
      } catch (e) {
        console.log(e)
        this.data = {};
      }
    },
  };
}

export const saveSystem = makeSaveSystem("save.json")
