### **SchoolSphere UI/UX Design Specification**

This document outlines the design system for the SchoolSphere application, based on the provided visual inspiration. The goal is to create a user interface that is modern, elegant, intuitive, and professional.

### 1. Overall Aesthetic

The design projects a sense of calm competence. It's clean, organized, and uses space effectively to prevent cognitive overload, which is crucial for a data-rich application like a school management system.

*   **Mood & Feel**: Professional, clean, and approachable. The use of soft colors, rounded corners, and ample whitespace creates a friendly and modern environment.
*   **Visual Hierarchy**: A clear hierarchy is established through typography and element placement. Key information, like the main dashboard stats, is presented first and given prominence.
*   **Whitespace**: Generous use of whitespace (margins and padding) is a core principle. It declutters the interface and improves readability.
*   **Design Patterns**: The design heavily relies on a card-based layout, which is excellent for organizing information into logical, digestible chunks. It also incorporates modern data visualization and clear navigation patterns.

### 2. Color Palette

The palette is minimal and well-balanced, with a primary neutral base, a calming primary color, and a warm accent for highlights. It includes variants for both light and dark modes.

| Role                 | Light Mode                               | Dark Mode                                | Usage Notes                                                              |
| -------------------- | ---------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| **Page Background**  | `Neutral-50` (`#F8F9FA`)                 | `Neutral-950` (`#111827`)                | The main background color for the entire application canvas.             |
| **Content/Card BG**  | `Neutral-100` (`#FFFFFF`)                | `Neutral-900` (`#1F2937`)                | Background for cards, modals, sidebars, and other content containers.    |
| **Primary Text**     | `Neutral-900` (`#212529`)                | `Neutral-100` (`#F9FAFB`)                | For headings, body text, and important labels.                           |
| **Secondary Text**   | `Neutral-500` (`#6C757D`)                | `Neutral-400` (`#9CA3AF`)                | For sub-headings, helper text, and less important information.           |
| **Primary Accent**   | `Primary-500` (`#3B82F6`)                | `Primary-500` (`#3B82F6`)                | For primary buttons, active navigation, icons, and chart elements.       |
| **Secondary Accent** | `Accent-400` (`#FB923C`)                 | `Accent-400` (`#FB923C`)                 | For highlights, secondary chart elements, and call-to-action sections.   |
| **Border/Divider**   | `Neutral-200` (`#E5E7EB`)                | `Neutral-700` (`#374151`)                | For subtle borders on inputs, cards, and table rows.                     |

### 3. Typography

A clean, legible sans-serif font is recommended. **Inter** is an excellent choice, available on Google Fonts, as it's designed for UI and offers a wide range of weights.

*   **Font Family**: `Inter`, with a fallback to standard system sans-serif fonts.

| Element             | Font Size | Font Weight | Letter Spacing | Usage                                       |
| ------------------- | --------- | ----------- | -------------- | ------------------------------------------- |
| **Page Title (H1)** | 28px      | Bold (700)  | -0.5px         | e.g., "Dashboard", "Teachers"               |
| **Section Title (H2)**| 22px      | SemiBold (600)| -0.25px        | e.g., "Earnings", "Notice Board"            |
| **Card Title (H3)** | 18px      | SemiBold (600)| Normal         | e.g., "Students", "Event Calendar"          |
| **Body / Default**  | 16px      | Regular (400)| Normal         | Main paragraphs and data text.              |
| **Secondary Text**  | 14px      | Regular (400)| Normal         | Helper text, timestamps, muted info.        |
| **UI Elements**     | 14px      | Medium (500)  | Normal         | Buttons, navigation links, input fields.    |

### 4. Layout Principles

The layout is structured and grid-based, promoting consistency and scalability.

*   **Main Structure**: A three-column layout is used where needed:
    1.  **Left Sidebar (Navigation)**: Fixed width, approx. **240px**. Contains the primary navigation links with icons.
    2.  **Main Content Area**: A flexible, grid-based area for the main content.
    3.  **Right Sidebar (Contextual)**: Appears on certain pages (like the main dashboard) for supplementary information like calendars or timelines. Approx. **320px**.
*   **Grid System**: The main content area should use a CSS Grid or Flexbox layout. A **24px** gap between grid items (cards) is recommended.
*   **Spacing (Padding/Margins)**: A consistent spacing scale based on **8px** should be used.
    *   **Card Padding**: **24px** on all sides.
    *   **Section Margin**: **32px-48px** vertical margin between large content sections.
*   **Responsiveness**:
    *   **Tablet**: The right sidebar could stack below the main content or be hidden. The left sidebar could collapse into an icon-only view.
    *   **Mobile**: The left sidebar should be hidden behind a "hamburger" menu. The main content grid should collapse into a single column, with cards stacking vertically.

### 5. Component Styling

This section provides specific styling guidance for common UI components, which aligns perfectly with the philosophy of a library like Shadcn UI.

*   **Cards**:
    *   **Background**: Use `Content/Card BG` color.
    *   **Border Radius**: `16px`.
    *   **Border**: No border in light mode. A `1px` solid `Border/Divider` in dark mode.
    *   **Box Shadow**: A soft, subtle shadow to lift the card. `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);`.

*   **Buttons**:
    *   **Border Radius**: `8px`.
    *   **Primary Button**: Solid `Primary Accent` background, white text.
    *   **Secondary Button**: White/transparent background, `Primary Accent` text, and a `1px` solid border in `Primary Accent` color.
    *   **Ghost/Tertiary Button**: No background or border. Text color is `Secondary Text`, changing to `Primary Text` on hover.
    *   **Padding**: `10px 16px` for standard buttons.

*   **Input Fields (e.g., Search)**:
    *   **Background**: `Neutral-200` (Light Mode) / `Neutral-700` (Dark Mode).
    *   **Border**: No border.
    *   **Border Radius**: `8px`.
    *   **Padding**: `10px 14px`, with extra padding for an icon.
    *   **Text**: Use `UI Elements` typography style.

*   **Navigation (Left Sidebar)**:
    *   List of items with an icon and text label.
    *   **Active Item**: Should have a background color of `Primary Accent`, with white text. Apply a `8px` border radius to the background.
    *   **Inactive Item**: Icon and text should use `Secondary Text` color.
    *   **Hover (Inactive)**: Background should fade in to a light gray (`Neutral-200` at 50% opacity).

*   **Tables**:
    *   **Rows**: Separate rows with a `1px` horizontal `Border/Divider`. No vertical borders.
    *   **Header**: Use `Secondary Text` color and `Medium (500)` font weight.
    *   **Cell Padding**: `12px 24px`.
    *   **Hover**: Row should have a subtle background color change (e.g., `Neutral-50`).

*   **Badges/Tags (e.g., Status)**:
    *   Use a pill shape (`border-radius: 9999px`).
    *   Use a light, desaturated version of a status color for the background (e.g., light green for "Active") and a darker shade of the same color for the text.

---

This specification should provide a solid foundation for building the SchoolSphere UI. By following these guidelines, you can create an interface that is not only visually appealing but also highly functional and user-friendly. Let me know if you need any further clarification!
