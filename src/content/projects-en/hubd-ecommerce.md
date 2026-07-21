---
title: HUBD Fast-Fashion E-Commerce Platform
role: Full-Stack Engineer + Project Manager
period: "2025.02 - 2025.04"
tags: [React, Laravel, MySQL, Vite, Tailwind]
metrics: "5-person team, delivered customer-side + enterprise-side MVP in 8 weeks"
order: 10
categories: [fullstack, pm]
---

> Happy unbirthday 🎂 | 364 — happy un-birthday | "You still shine brightly on the 364 days that are not your birthday."

- **Period**: February 2025 - April 2025 (three months)
- **Role**: Full-Stack Engineer + Project Manager (full-stack engineering, CMS development, project management, UI/UX design)
- **Responsibility**: Site development and API integration
- **Organization**: iSpan International
- **GitHub**: [project-hubd-summary-version](https://github.com/leemengju/project-hubd-summary-version)

![HUBD fast-fashion e-commerce platform project cover](/banners/hubd-ecommerce.webp)

## Project Overview

### 01 | Project Goal

This project was the capstone of iSpan International's full-stack training program PHPD09, built by a five-person team. We developed the front end with React, Vite, Tailwind and Shadcn UI, used Laravel (PHP) as the back-end framework, stored data in MySQL, and managed the codebase with GitHub to keep the development environment stable — ultimately delivering both the customer-side and enterprise-side features of the e-commerce platform.

### 02 | Role and Deliverables

I served as full-stack developer and project manager, covering the complete flow from product ideation and design through development. I led product ideation and schedule planning, defined the target users and designed the site architecture, and carried out UI design and development. Together with the team I set up the React and Laravel environments, designed the database schema, and integrated the front and back ends via APIs, finally consolidating the project and presenting the results in the closing presentation.

### 03 | Challenges

Most members lacked real development experience and had to learn new technologies while building the capstone and preparing for interview written-test reviews, under enormous time pressure. We met almost daily to confirm feature requirements, sync progress, debug together and integrate the project — a severe test of novice engineers' resilience and self-directed learning.

### 04 | Results

Despite the many challenges, we completed the project MVP, with the customer-side and enterprise-side systems running independently. API integration enabled order information, catalog synchronization, marketing campaigns, payment transactions, membership management and system settings, improving the experience of multiple stakeholders and keeping the system running stably.

![Overview of customer-side and enterprise-side screens](/legacy/project5/media05.png)

## Background

### Why This Topic

The project focuses on a fast-fashion e-commerce platform, responding to market demand and industry trends. According to Statista, the global fast-fashion market was projected to exceed US$133 billion in 2024 and keeps growing; online shopping already accounts for over 30% of global apparel retail, making e-commerce the primary sales channel. Yet traditional platforms still fall short in product management and buyer–seller interaction, and small and mid-size brands in particular lack efficient tools. This project provides a curated storefront and a seller CMS to help brands improve operational efficiency and user experience, and create greater value.

### What We Built

The project is a fast-fashion e-commerce platform where buyers browse curated fashion apparel and accessories. Sellers manage their business efficiently through a seller content management system (CMS) covering product listing, order processing, membership management, payment settlement and campaign marketing, keeping operations running smoothly.

![Illustration of the customer-side and enterprise-side systems](/legacy/project5/media04.png)

## Team and Division of Work

The five team members each took ownership of storefront pages and back-office modules, and split the foundational work of framework setup, site planning, server and database setup, and technical execution and testing; I owned the cart and checkout pages and order management, while also handling site planning, project management and UI consolidation.

![Division of work across the five-person team](/legacy/project5/media10.png)

## System Architecture

The platform consists of two systems. The customer side covers login and registration, products (product categories, silver-clay courses), about us, the member center (profile, my orders, shipping addresses, payment info, my coupons), the wishlist and the shopping cart.

![Customer-side system architecture](/legacy/project5/media32.png)

The enterprise side covers login and registration, product & storefront management (product management, storefront management), order management, payment management (reconciliation and reports, transaction records, payment settings), membership management, system settings and marketing management (campaign setup, coupon management).

![Enterprise-side system architecture](/legacy/project5/media25.png)

## Technical Notes

### Stack and Tools

The project spans project management, UI/UX design and full-stack development. We tracked progress and managed versions with Notion and GitHub, and used Figma and FigJam for wireframes and the sitemap. Development used React, jQuery, Laravel and Vite with Tailwind CSS and Shadcn UI, MariaDB as the database, and React Router, Axios and RESTful APIs to improve performance and extensibility.

![Overview of project-management, UI/UX and development tools](/legacy/project5/media11.png)

### Technical Flow: Front End

This diagram shows the architecture of the project's React application. The app boots from index.html and enters the core logic (src/App.jsx) via src/main.jsx. Routing is handled by src/routers/Routers.jsx, which renders the different page components. Each page component builds its view from shared UI components. These views interact with the service layer (api.js, AuthService.js) to call the back-end Laravel API for data. Configuration files such as tailwind.config.js and vite.config.js manage styling and the build process, and static assets (images and utility files) support the app's features. The whole architecture works together to keep data flowing smoothly from front end to back end and pages rendering correctly.

![Front-end React application architecture flow](/legacy/project5/media19.png)

### Technical Flow: Back End

This diagram shows the Laravel architecture flow. When a user sends an API request, it is received by the API gateway (public/index.php) and forwarded via the routes (routes/api.php) to the corresponding controller (app/Http/Controllers). Along the way the request passes through middleware for authentication and other processing. Controllers invoke business logic or models (app/Models) and interact with the database (MariaDB). Finally, static files such as images are served from storage (storage/app/public). The flow covers the complete architecture from configuration and bootstrapping to data persistence and file handling.

![Back-end Laravel architecture flow](/legacy/project5/media14.png)

## Target Audience

For the audience analysis, we bring in three key stakeholders — a general consumer, an enterprise marketing staffer and a business manager — and simulate their real operations in our system.

![Three stakeholder personas: buyer Polly, marketing planner Daniel, business manager Lance](/legacy/project5/media15.jpg)

## Scenario Walkthroughs

### Scenario 1: Customer Side | Young Professional

"I'm Polly, 35, a mother of two based in Da'an, Taipei, working as a junior manager in finance. You can tell from these labels how much social expectation, constraint and pressure I carry. One of my few indulgences is buying fashion pieces to reward my hard work — and HUBD is my best salvation."

![Customer-side login page with Facebook and Line quick entry](/legacy/project5/media08.png)

![Customer-side homepage: campaign carousel and hit items](/legacy/project5/media09.png)

![Cart and checkout flow (mobile)](/legacy/project5/media07.png)

### Scenario 2: Enterprise Side | Marketing Planner

"I'm Daniel, a marketing planner at HUBD. I've just wrapped up the site-wide Mother's Day campaign and now I'm preparing July's summer-anniversary event to keep May's sales momentum going. Our sales department recently signed a deal with a well-known Korean-celebrity agency allowing the platform to sell the endorsed co-branded tops. Now I need to list that product, update the homepage carousel, and add anniversary coupons for users. And when the site has issues, I also set up maintenance mode to keep the system healthy."

![Enterprise-side marketing management: campaign list and stat cards](/legacy/project5/media02.png)

![Enterprise-side product & storefront management: homepage carousel settings](/legacy/project5/media29.png)

### Scenario 3: Enterprise Side | Business Manager

"I'm Lance, a business manager at HUBD. Among my routines are maintaining relationships with brand partners, regularly reporting revenue to my superiors, and supporting cross-department collaboration. Our system helps me a great deal with all of it."

## Conclusions

Bringing the above together, the fast-fashion platform we built resolves the core pain points of its key roles and clearly improves the overall user experience.

- For buyers, the platform offers a smooth shopping flow and product information that updates in real time. From the sense of occasion on the homepage to precise recommendations, it strengthens brand loyalty and customer stickiness.
- For frontline enterprise staff, the CMS simplifies tedious flows such as product listing and marketing management, letting employees operate far more efficiently and smoothing the overall workflow.
- For mid-level managers, the system strengthens order and payment management, helping them quickly filter and manage business data and raising management efficiency.
- The system also facilitates cross-department collaboration and vertical reporting, improving decision-making efficiency and safeguarding stable business operations.

Going forward, through iteration and partner acquisition, the platform can extend its feature framework and partner brands and amplify the brand's influence.

![Six value pillars: better buyer experience, operational efficiency, precise data access, cross-department collaboration, upward reporting, partner expansion](/legacy/project5/media31.png)

## Reflection and Learning

### Project Planning

- Plan the project in phases: set an MVP for each phase and adjust it to actual progress and resources. That is what makes Sprint-style delivery real, prevents waterfall development from forcing features to be cut, and reduces early-stage crunch.
- Keep aligning with user needs. When designing features, keep the product and user positioning and the user stories from the planning phase in mind, so the design does not drift into features that might get used but do not quite follow the logic.

### UI Design

- UI work cannot consider only aesthetics and usability; it must also account for developer workload and the difficulty of API integration.

### Development Execution

- Technical support was not proactive enough — help arrived only when problems occurred, with no reference documentation or shared infrastructure prepared in advance.
- The version-control flow was somewhat over-complicated and never adapted to reality; each small completed feature should have been merged into the core branch promptly to avoid overwritten work and a painful final merge.
- Without a code-review mechanism, coding logic diverged across members and later maintenance became harder. For example, the same pagination and file-export features ended up with different UIs and implementations, hurting system-wide consistency and readability.

## Future Improvements

### Third-Party Integrations

- Enable third-party login on the customer side (Line, Google) and bring proper authentication and role-based permissions to the enterprise side. With a full notification system and email notifications, notification items could be toggled per role.
- Complete the payment and logistics flows by integrating ECPay and the 7-11 or FamilyMart convenience-store address APIs.

### Database

- Manage the schema with migrations and seeders for version control and data initialization, so a broken state can simply be dropped and rebuilt for consistency; the trade-off is a heavier workload for the database owner.
- Put the database under a single dedicated owner to avoid concurrent edits leaving data readable but not updatable, or corrupted after updates. When multiple people must adjust it, discuss and agree as a team first to keep the schema and logic consistent.
- Make both the homepage hit items and the product cards below manageable from the back office. Currently a set number of products is auto-fetched in product-ID order; adding curated-product management would let the back office flexibly choose what to display.

### Git Workflow

- Put Git flow under a dedicated owner, while other members practice opening pull requests and joining reviews — building the team's familiarity with version control and the overall stability of collaboration.
