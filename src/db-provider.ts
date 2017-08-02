import { Injectable } from "@angular/core";
import { Platform } from "ionic-angular";

const win: any = window;

@Injectable()
export class DBProvider {
	private _dbPromise: Promise<any>;
  private platform = new Platform();
	constructor(private dbName: string) {

    this._dbPromise = new Promise((resolve, reject) => {
			try {
				let _db: any;
				if (this.platform.is('cordova') && win.sqlitePlugin) {
					//FOR MOBILE DEVICE
					_db = win.sqlitePlugin.openDatabase({
						name: this.dbName,
						location: 'default'
					});
				} else {
					//FOR WEBSQL
					console.warn('Storage: SQLite plugin not installed, falling back to WebSQL. Make sure to install cordova-sqlite-storage in production!');
					_db = win.openDatabase(this.dbName, '1.0', 'database', 5 * 1024 * 1024);
				}
				resolve(_db);
			} catch (err) {
				reject({ err: err });
			}
		});
		this._tryInit();
	}

	// Initialize the DB with our required tables
	_tryInit() {
		this.query(`CREATE TABLE IF NOT EXISTS AppUser (
                         UserId	INTEGER NOT NULL,
                         MobileNo	TEXT NOT NULL UNIQUE,
                         Email	TEXT,
                         PRIMARY KEY(UserId)
                     )`).catch(err => {
				console.error('Storage: Unable to create initial storage tables', err.tx, err.err);
			});
	}

	getAppUsers(): Promise<any> {
		return this.query('SELECT * FROM AppUser').then(data => {
			if (data.res.rows.length > 0) {
				console.log('Rows found.');
				if (this.platform.is('cordova') && win.sqlitePlugin) {
					let result = <any>[];

					for (let i = 0; i < data.res.rows.length; i++) {
						var row = data.res.rows.item(i);
						result.push(row);
					}

					return result;
				}
				else {
					return data.res.rows;
				}
			}
		});
	}

	insertAppUser(): Promise<any> {
		let id = 1;
		let mobileno = '8905606191';
		let email = 'niravparsana94@gmail.com';

		this.query('INSERT INTO AppUser (UserId, MobileNo, Email) VALUES (' + id + ' ,\"' + mobileno + '\" ,\"' + email + '\")', []);
		return this.query('INSERT INTO AppUser (UserId, MobileNo, Email) VALUES (2, "9876543210","abc@gmail.com")', []);
	}

	updateAppUser(UserId): Promise<any> {
		let query = "UPDATE AppUser SET Email=? WHERE UserId=?";
		return this.query(query, ['niravparsana@outlook.com', UserId]);
	}

	deleteAppUser(UserId): Promise<any> {
		let query = "DELETE FROM AppUser WHERE UserId=?";
		return this.query(query, [UserId]);
	}

	query(query: string, params: any[] = []): Promise<any> {
		return new Promise((resolve, reject) => {
			try {
				this._dbPromise.then(db => {
					db.transaction((tx: any) => {
						tx.executeSql(query, params,
							(tx: any, res: any) => resolve({ tx: tx, res: res }),
							(tx: any, err: any) => reject({ tx: tx, err: err }));
					},
						(err: any) => reject({ err: err }));
				});
			} catch (err) {
				reject({ err: err });
			}
		});
	}
}
