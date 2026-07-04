import { defineMcp } from "@lovable.dev/mcp-js";
import listParksTool from "./tools/list-parks";
import getParkTool from "./tools/get-park";

export default defineMcp({
  name: "zenzyy-mcp",
  title: "Zenzyy Water Parks",
  version: "0.1.0",
  instructions:
    "Tools for browsing Zenzyy water parks in India. Use `list_parks` to discover parks (optionally filtered by name/location) and `get_park` to fetch full details for one park by ID.",
  tools: [listParksTool, getParkTool],
});