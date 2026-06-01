export { UtilityVerifier as UtilityVerifier } from './Utility.Verifier';
export { UtilityEncryption } from './Utility.Encryption';
export { UtilityRandom } from './Utility.Random';
export { UtilityJson } from './Utility.Json';
export { UtilityText } from './Utility.Text';
export { UtilityConverter } from './Utility.Converter';
export { UtilityPath } from './Utility.Path';
export { UtilityCompression } from './Utility.Compression';
export type { ICompressionHelper } from './Utility.Compression';
export type { IJsonHelper } from './Utility.Json';
export type { ITextHelper } from './Utility.Text';

import { UtilityVerifier } from './Utility.Verifier';
import { UtilityEncryption } from './Utility.Encryption';
import { UtilityRandom } from './Utility.Random';
import { UtilityJson } from './Utility.Json';
import { UtilityText } from './Utility.Text';
import { UtilityConverter } from './Utility.Converter';
import { UtilityPath } from './Utility.Path';
import { UtilityCompression } from './Utility.Compression';

export const Utility = {
    Verifier: UtilityVerifier,
    Encryption: UtilityEncryption,
    Random: UtilityRandom,
    Json: UtilityJson,
    Text: UtilityText,
    Converter: UtilityConverter,
    Path: UtilityPath,
    Compression: UtilityCompression,
};
