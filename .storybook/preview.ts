import type { Preview } from "@storybook/react";
import "../src/index.css"; // Import Tailwind CSS styles

const preview: Preview = {
  parameters: {
    viewport: {
      viewports: {
        desktop: {
          name: "Desktop",
          styles: { width: "1280px", height: "720px" },
        },
        tablet: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
        },
        mobile: {
          name: "Mobile",
          styles: { width: "375px", height: "667px" },
        },
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#0a0a0f" },
        { name: "light", value: "#ffffff" },
      ],
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
