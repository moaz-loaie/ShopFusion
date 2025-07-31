# ShopFusion

[![CI/CD Pipeline](https://github.com/your-org/ShopFusion/actions/workflows/main.yml/badge.svg)](https://github.com/your-org/ShopFusion/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/your-org/ShopFusion/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/ShopFusion)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

ShopFusion is a cutting-edge e-commerce platform inspired by industry leaders like Amazon. Our goal is to deliver a robust, scalable, and user-friendly online shopping experience that caters to guests, registered customers, sellers, and administrators—with seamless mobile integration.

## Overview

This repository houses our comprehensive project documentation, including detailed requirements and design assets. Our design documentation is organized into multiple files:

- **Design Assets Overview:** Please see [Design Assets Overview](docs/design/design-assest.md) for a complete review of our diagrams, wireframes, and other visual assets.
- **Specific Design Files:**
  - **ERD and System Diagrams:** Editable source files (draw.io) along with exported SVG versions.
  - **Wireframes:** Exported as PNG files.
  - **Figma Designs:** Interactive prototypes and additional design iterations are available via the Figma Design Dashboard.

As development evolves, additional directories for our backend, dynamic frontend, tests, and deployment scripts will be added.

### Key Features

- **Guest functionalities:** Browsing and searching products.
- **Customer functionalities:** Account registration, secure login, shopping cart management, checkout, and order tracking.
- **Seller functionalities:** Product listing management and inventory control.
- **Mobile integration:** Responsive design with native features (push notifications, biometric authentication, QR code scanning, offline caching).
- **Administrator functionalities:** User and seller management, product moderation, order oversight, and real-time analytics.

## Design Documentation

Our design assets for ShopFusion are organized within the `docs/design` directory. For a complete overview of our visual design elements—including ERD diagrams, system diagrams, wireframes, and links to Figma prototypes—please refer to the [Design Assets Overview](docs/design/design-assets.md).

### ERD Diagram

- **Editable Source:**  
  [`docs/design/erd/erd.drawio`](docs/design/erd/Database_ER_Diagram.drawio)

- **Exported Version:**  
  ![ERD Diagram](docs/design/erd/Database_ER_Diagram.svg)

### System Diagram

- **Editable Source:**  
  [`docs/design/system-diagrams/system-diagram.drawio`](docs/design/system-diagrams/System_Architecture_Diagram.drawio)

- **Exported Version:**  
  ![System Diagram](docs/design/system-diagrams/System_Architecture_Diagram.svg)

## Wireframes

**Homepage Wireframe:**  
![Homepage Wireframe](docs/design/wireframes/Homepage.png)

**Product Page Wireframe:**  
![Product Page Wireframe](docs/design/wireframes/Product-Detail-Page.png)

## Figma Designs

For additional design iterations and interactive prototypes, please refer to our Figma designs:  
[See the Figma Design Dashboard](docs/design/figma/)

## Features

- 🛍️ Role-based product management
- 📊 Advanced dashboards for admins and sellers
- 🔒 Secure authentication and authorization
- 📱 Fully responsive design
- 🚀 Optimized performance
- 🧪 Comprehensive test coverage

## Quick Start

### Prerequisites

- Node.js v18+
- MySQL 8.0+
- Docker (optional)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-org/ShopFusion.git
   cd ShopFusion
   ```

2. Install dependencies:

   ```bash
   npm install
   npm install -w client
   npm install -w server
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   ```

4. Set up the database:

   ```bash
   npm run db:migrate -w server
   npm run db:seed -w server
   ```

5. Start the development servers:

   ```bash
   npm run dev -w client    # Start client on http://localhost:5173
   npm run dev -w server    # Start server on http://localhost:3000
   ```

### Running Tests

```bash
# Run all tests with coverage
npm run test:coverage -w client
npm run test:coverage -w server

# Run tests in watch mode
npm run test:watch -w client
npm run test:watch -w server
```

### Docker Deployment

```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## Documentation

- [API Documentation](docs/API_SPEC.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Architecture

The application follows a modern microservices architecture:

- **Frontend**: React with Vite, React Router, and modern CSS
- **Backend**: Express.js REST API with JWT authentication
- **Database**: MySQL with Sequelize ORM
- **Testing**: Jest, React Testing Library, and Supertest
- **CI/CD**: GitHub Actions with automated testing and deployment

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
