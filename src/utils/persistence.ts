export class Persistence {
  static saveObject(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  static loadObject(key: string): any {
    const data = localStorage.getItem(key);
    if (data === null) return null;
    return JSON.parse(data);
  }

  static saveCsv(data: string) {
    this.saveObject("csv_params", { data });
  }

  static loadCsv(): { data: string } {
    const result = this.loadObject("csv_params");

    if (result === null) {
      return {
        data: "var1,var2\n123,456",
      };
    }

    return {
      data: result.data,
    };
  }
}
