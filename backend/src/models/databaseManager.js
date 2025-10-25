const Database = require('./database');

class DatabaseManager {
  constructor() {
    this.instance = null;
  }

  async getInstance() {
    if (!this.instance) {
      this.instance = new Database();
      await this.instance.waitForInit();
    }
    return this.instance;
  }

  closeInstance() {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
    }
  }
}

// 导出单例
module.exports = new DatabaseManager();