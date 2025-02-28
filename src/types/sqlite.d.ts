declare module 'sqlite' {
    import sqlite3 from 'sqlite3';
  
    interface OpenOptions {
      filename: string;
      driver: any;
    }
  
    export function open(options: OpenOptions): Promise<sqlite3.Database>;
  }
  