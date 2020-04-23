/**
 * Controls the management of 2Keys packages
 */
import mkdirp from "mkdirp";
import Datastore from "nedb-promises";
import { promisify } from "util";
import { promises as fs } from "fs";
import { join } from "path";
import npm from "npm";
import { Logger } from "@twokeys/core";
import { DEFAULT_REGISTRY_ROOT_PACKAGE_JSON, REGISTRY_FILE_NAME } from "./constants";
import { PackageInDB, TWOKEYS_ADDON_TYPES_ARRAY } from "./interfaces";

const logger = new Logger({
	name: "add-ons:registry",
});

/**
 * Options for add-on registry
 */
interface AddOnsRegistryOptions {
	/** Location of registry database (a .db file) */
	dbFilePath?: string;
}

/**
 * Options when installing a package
 */
interface InstallOptions {
	/** Local package or not? */
	local?: boolean;
	/** Force npm install & adding to registry */
	force?: boolean;
}

/**
 * Options when adding a package to registry
 */
interface AddPackageOptions {
	force?: boolean;
}

/**
 * Return type of {@link AddOnsRegistry#addPackage}
 */
interface AddPackageReturn { status: boolean; message?: string; }

/**
 * Registry class.
 * Handles management of add-ons
 * How a registry works:
 * - In the root there are two files `package.json` and `twokeys-registry.db` and a `node_modules` directory
 * 	- `package.json` is a normal npm `package.json` and stores a list of dependencies, which is the list of installed add-ons (packages)]
 * 	- `twokeys-registry.db` is an easy access DB with information about the add-ons so we don't have to load all the package.json of the add-ons.  See {@link PackageInDB} for contents
 * 	- `node_modules` contains the add-ons themselves
 */
export default class AddOnsRegistry {

	private directory: string;
	private registry: Datastore;
	private registryDBFilePath: string;

	/**
	 * Initalises a new registry class for the registry at `dir`
	 * @param dir Directory with root package.JSON in
	 */
	constructor(dir: string, options?: AddOnsRegistryOptions) {
		logger.debug(`New registry class created for ${dir}`);
		this.directory = dir;
		this.registryDBFilePath = options?.dbFilePath || join(this.directory, REGISTRY_FILE_NAME);
		logger.debug("Loading registry DB file...");
		this.registry = Datastore.create({ filename: this.registryDBFilePath });
	}

	/**
	 * Validates a package.json
	 * @param packageJSON Parsed package.json to validate
	 * @returns flag of if package was added (true) or not (false) and err message if not added
	 */
	private validatePackageJSON(packageJSON: any): { status: boolean, message?: string } {
		logger.debug("Validating a package.json...");
		logger.debug(JSON.stringify(packageJSON));
		// Check if has twokeys metadata
		if (!Object.prototype.hasOwnProperty.call(packageJSON, "twokeys")) {
			logger.err("Package does not contain 2Keys metadata!");
			return {
				status: false,
				message: "Package does not contain 2Keys metadata!",
			};
		}
		// Check type is valid
		if (!packageJSON.twokeys?.types?.some(element => TWOKEYS_ADDON_TYPES_ARRAY.includes(element))) {
			logger.err("No valid type was listed in the package.json!");
			return {
				status: false,
				message: "No valid type was listed in the package.json!",
			};
		}
		// Check if entry points present
		for (const addOnType in packageJSON.twokeys?.entry) {
			if (TWOKEYS_ADDON_TYPES_ARRAY.includes(addOnType)) {
				if (!(Object.prototype.hasOwnProperty.call(packageJSON.twokeys?.entry, addOnType) && typeof packageJSON.twokeys?.entry[addOnType] === "string")) {
					logger.err(`Entry point was not found for add-on type ${addOnType}`);
					return {
						status: false,
						message: `Entry point was not found for add-on type ${addOnType}`,
					};
				}
			} else {
				logger.warn(`Type ${addOnType} is not a valid type.  ignoring...`);
			}
		}
		return { status: true };
	}

	/**
	 * Adds a package to the registry DB
	 * @param name Name of package to add
	 * @returns flag of if package was added (true) or not (false) and message why if not added
	 */
	public async addPackage(name: string, options?: AddPackageOptions): Promise<AddPackageReturn> {
		logger.info(`Adding package (add-on) ${name} to DB...`);
		const packageLocation = join(this.directory, "node_modules", name);
		logger.debug(`Package location: ${packageLocation}`);
		logger.debug("Checking if package already in registry...");
		const docs = await this.registry.find({ name });
		if (docs.length > 0) {
			if (!options?.force) {
				logger.warn(`Package ${name} was already in the registry.`);
				logger.warn(`If you want to force overwrite what is in the registry, please pass { force: true } to AddOnsRegistry.addPackage().`);
				logger.warn("This probably means --force on the CLI.");
				return {
					status: false,
					message: "Package already in registry.",
				};
			} else {
				logger.warn(`Removing any packages by name ${name} in registry already.`);
				await this.registry.remove({ name }, { multi: true });
				logger.debug("Documents removed.");
			}
		}
		logger.debug("Checking if package is already installed...");
		try {
			await fs.access(packageLocation);
			logger.debug("Reading package.json");
			const packageJSON = JSON.parse((await fs.readFile(join(packageLocation, "package.json"))).toString("utf8"));
			// Validate
			const validation = this.validatePackageJSON(packageJSON);
			if (!validation.status) {
				logger.err("Error validating package.json.");
				logger.warn("Package not added.");
				return {
					status: false,
					message: validation.message,
				};
			}
			// Check if has entry point
			logger.debug("Inserting...");
			// Type cast & promisify
			const docToInsert: PackageInDB = {
				name: packageJSON.name,
				types: packageJSON.twokeys.types,
				entry: packageJSON.twokeys.entry,
				info: {
					version: packageJSON.version,
					description: packageJSON.description,
					size: null, // Inserted later
				},
			};
			// Add optional stuff
			if (packageJSON.twokeys.displayName) {
				docToInsert.info.displayName = packageJSON.twokeys.displayName;
			}
			if (packageJSON.twokeys.iconURL) {
				docToInsert.info.iconURL = packageJSON.twokeys.iconURL;
			}
			logger.debug("About to run insert");
			await this.registry.insert([docToInsert]);
			logger.info(`Package ${name} added to registry.`);
			return { status: true };
		} catch (err) {
			logger.err("ERROR!");
			if (err?.code === "ENOENT") {
				logger.err("Executor not installed, or no package.json");
				logger.err(err.message);
				throw new Error(`Package (add-on) ${name} not installed, or package.json does not exist`);
			} else {
				throw err;
			}
		}
	}

	/**
	 * Installs a new package (through {@link AddOnsRegistry#runNpmInstall}) AND adds it to the registry
	 * @param packageName Packe to install
	 * @param options Options
	 */
	public async install(packageName: string, options?: InstallOptions): Promise<AddPackageReturn> {
		logger.debug("Installing new package...");
		try {
			await this.runNpmInstall(packageName, options);
			logger.debug("Adding package to registry...");
			// If local, get Name and use that
			if (options?.local) {
				logger.debug("Local package.  Getting name...");
				const packageJSON = JSON.parse((await fs.readFile(join(packageName, "package.json"))).toString("utf8"));
				return await this.addPackage(packageJSON.name, options);
			} else {
				return await this.addPackage(packageName, options);
			}
		} catch (err) {
			throw err;
		}
	}

	/**
	 * Installs a new package using npm
	 * It is recommended this is ran in a worker thread.
	 * WARNING! This will change the current dir
	 * WARNING! This does not add the package to the registry either
	 * @param packageName Name of package to install
	 * @param options Options
	 */
	private runNpmInstall(packageName: string, options?: InstallOptions): Promise<void> {
		return new Promise((resolve, reject) => {
			const npmLogger = new Logger({ // For npm to log with
				name: "add-ons:registry:npm",
			});
			logger.info(`Installing new package ${packageName}...`);
			logger.debug("Running install...");
			const oldCWD = this.directory;
			process.chdir(this.directory); // So lock files are made etc
			logger.debug(`Changed dir to ${this.directory}.`);
			// Functions
			npm.load({
				"bin-links": false,
				"save": true,
				"force": options?.force ? true : false,
			}, (err) => {
				// catch errors
				if (err) { reject(err); }
				logger.debug("Npm loaded.");
				npm.commands.install([packageName], (er, data) => {
					if (er) { reject(er); }
					npmLogger.info(data);
					process.chdir(oldCWD);
					logger.debug("Gone back to old CWD.");
					logger.info("Package (add-on) installed.");
					resolve();
				});
				npm.on("log", (message) => {
					// log the progress of the installation
					npmLogger.info(message);
				});
			});
		});
	}

	/**
	 * Creates a new registry in dir
	 * @param dir Directory to create registry in
	 */
	public static async createNewRegistry(dir: string) {
		logger.info(`Creating new registry in ${dir}...`);
		try { await mkdirp(dir); } catch (err) { throw err; }
		logger.debug("Directory made.");
		logger.debug("Writing default package.json...");
		fs.writeFile(join(dir, "package.json"), JSON.stringify(DEFAULT_REGISTRY_ROOT_PACKAGE_JSON));
		logger.debug("Creating registry DB...");
		try {
			const fd = await fs.open(join(dir, REGISTRY_FILE_NAME), "w");
			await fd.close(); // CLose immediately
		} catch (err) {
			throw err;
		}
		logger.info("Registry created.");
	}

}
