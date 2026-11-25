import { Config } from "@remotion/cli/config";

// JPEG frames keep Studio and draft renders fast; the 4K master sets its own flags.
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
