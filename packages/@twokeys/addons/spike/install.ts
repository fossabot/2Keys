/**
 * Spike install
 */
import { join } from "path";
import AddOnsRegistry from "../src/registry";
const directory = join(__dirname, "test");

AddOnsRegistry.createNewRegistry(directory)
	.then(() => {
		const reg = new AddOnsRegistry(directory);
		reg.install(join(__dirname, "../test/non-mocha/executor1"), {
			local: true,
		})
			.catch((err) => { console.log(err.stack); });
	})
	.catch((err) => {
		console.log(err.stack);
		// throw err;
	});
