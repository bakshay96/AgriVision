"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomeInfo = void 0;
/**
 * Home Route Controller - Displays comprehensive backend information
 * This route serves as a welcome page and API documentation overview
 */
const getHomeInfo = (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const appInfo = {
        success: true,
        message: "Welcome to AgriVision Pro Backend API",
        description: "Comprehensive agricultural management platform with AI-powered features",
        version: "1.0.0",
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        // Application Details
        application: {
            name: "AgriVision Pro",
            description: "AI-powered agricultural management platform",
            features: [
                "Crop Management & Tracking",
                "AI-Powered Plant Disease Detection",
                "Weather Forecasting & Alerts",
                "Market Price Monitoring",
                "Inventory Management",
                "Order Processing System",
                "Financial Record Keeping",
                "Real-time Chat Support",
                "Multi-language Support",
                "Geolocation Services"
            ]
        },
        // Available API Routes
        apiRoutes: {
            authentication: {
                basePath: "/api/auth",
                endpoints: [
                    { method: "POST", path: "/register", description: "Register new user" },
                    { method: "POST", path: "/login", description: "User login" },
                    { method: "GET", path: "/me", description: "Get current user profile" },
                    { method: "PUT", path: "/profile", description: "Update user profile" }
                ]
            },
            crops: {
                basePath: "/api/crops",
                endpoints: [
                    { method: "GET", path: "/", description: "Get all crops" },
                    { method: "POST", path: "/", description: "Create new crop" },
                    { method: "GET", path: "/:id", description: "Get specific crop" },
                    { method: "PUT", path: "/:id", description: "Update crop" },
                    { method: "DELETE", path: "/:id", description: "Delete crop" }
                ]
            },
            orders: {
                basePath: "/api/orders",
                endpoints: [
                    { method: "GET", path: "/", description: "Get all orders" },
                    { method: "POST", path: "/", description: "Create new order" },
                    { method: "GET", path: "/:id", description: "Get specific order" },
                    { method: "PUT", path: "/:id", description: "Update order" },
                    { method: "DELETE", path: "/:id", description: "Delete order" }
                ]
            },
            ai: {
                basePath: "/api/ai",
                endpoints: [
                    { method: "POST", path: "/analyze-image", description: "Analyze plant image for diseases" },
                    { method: "POST", path: "/chat", description: "AI chat assistance" },
                    { method: "GET", path: "/history", description: "Get AI analysis history" }
                ]
            },
            inventory: {
                basePath: "/api/inventory",
                endpoints: [
                    { method: "GET", path: "/", description: "Get inventory items" },
                    { method: "POST", path: "/", description: "Add inventory item" },
                    { method: "GET", path: "/:id", description: "Get specific inventory item" },
                    { method: "PUT", path: "/:id", description: "Update inventory item" },
                    { method: "DELETE", path: "/:id", description: "Delete inventory item" }
                ]
            },
            weather: {
                basePath: "/api/weather",
                endpoints: [
                    { method: "GET", path: "/", description: "Get weather data" },
                    { method: "GET", path: "/forecast", description: "Get weather forecast" },
                    { method: "GET", path: "/alerts", description: "Get weather alerts" }
                ]
            },
            marketPrices: {
                basePath: "/api/market-prices",
                endpoints: [
                    { method: "GET", path: "/", description: "Get market prices" },
                    { method: "GET", path: "/trends", description: "Get price trends" },
                    { method: "GET", path: "/crops/:cropId", description: "Get prices for specific crop" }
                ]
            },
            cropEncyclopedia: {
                basePath: "/api/crop-encyclopedia",
                endpoints: [
                    { method: "GET", path: "/", description: "Get crop encyclopedia entries" },
                    { method: "GET", path: "/:id", description: "Get specific crop information" },
                    { method: "GET", path: "/search", description: "Search crop database" }
                ]
            },
            financial: {
                basePath: "/api/financial",
                endpoints: [
                    { method: "GET", path: "/", description: "Get financial records" },
                    { method: "POST", path: "/", description: "Create financial record" },
                    { method: "GET", path: "/reports", description: "Generate financial reports" }
                ]
            },
            upload: {
                basePath: "/api/upload",
                endpoints: [
                    { method: "POST", path: "/image", description: "Upload image file" },
                    { method: "POST", path: "/document", description: "Upload document file" }
                ]
            },
            user: {
                basePath: "/api/user",
                endpoints: [
                    { method: "GET", path: "/profile", description: "Get user profile" },
                    { method: "PUT", path: "/profile", description: "Update user profile" },
                    { method: "GET", path: "/preferences", description: "Get user preferences" }
                ]
            }
        },
        // Technology Stack
        technologyStack: {
            backend: "Node.js with Express.js",
            database: "MongoDB with Mongoose ODM",
            authentication: "JWT-based authentication",
            realTime: "Socket.io for WebSocket connections",
            storage: "AWS S3 for file uploads",
            ai: "Google Gemini AI for image analysis and chat",
            security: "Helmet.js, CORS, Rate limiting",
            validation: "Joi schema validation"
        },
        // Configuration Info
        configuration: {
            port: process.env.PORT || 5000,
            nodeEnv: process.env.NODE_ENV || 'development',
            databaseConnected: true,
            s3Configured: !!process.env.AWS_S3_BUCKET_NAME,
            aiConfigured: !!process.env.GEMINI_API_KEY,
            rateLimiting: {
                windowMs: process.env.RATE_LIMIT_WINDOW_MS || '15 minutes',
                maxRequests: process.env.RATE_LIMIT_MAX || 100
            }
        },
        // Health Check
        healthCheck: {
            endpoint: "/api/health",
            method: "GET",
            description: "Check API server status"
        },
        // Documentation
        documentation: {
            apiDocs: "Available via individual route documentation",
            postmanCollection: "Contact development team for Postman collection",
            support: "For technical support, contact the development team"
        },
        // Server Information
        serverInfo: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            pid: process.pid,
            platform: process.platform,
            nodeVersion: process.version
        }
    };
    // Return HTML response for browser access, JSON for API calls
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/html')) {
        // HTML response for browser viewing
        const htmlResponse = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AgriVision Pro - Backend API</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .header {
                background: linear-gradient(135deg,rgb(72, 44, 94),rgb(217, 230, 235));
                color: white;
                padding: 2rem;
                border-radius: 10px;
                text-align: center;
                margin-bottom: 2rem;
            }
            .section {
                background: white;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .endpoint {
                background: #f8f9fa;
                padding: 0.8rem;
                margin: 0.5rem 0;
                border-left: 4px solid #2c5e2e;
                border-radius: 4px;
            }
            .method {
                display: inline-block;
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                font-weight: bold;
                font-size: 0.8rem;
                margin-right: 0.5rem;
            }
            .get { background: #61affe; color: white; }
            .post { background: #49cc90; color: white; }
            .put { background: #fca130; color: white; }
            .delete { background: #f93e3e; color: white; }
            h1, h2, h3 {
                color:rgb(17, 19, 17);
            }
            .status {
                display: inline-block;
                padding: 0.3rem 0.8rem;
                border-radius: 20px;
                font-size: 0.9rem;
                font-weight: bold;
            }
            .success { background: #d4edda; color: #155724; }
            .info { background: #d1ecf1; color: #0c5460; }
            code {
                background: #f4f4f4;
                padding: 0.2rem 0.4rem;
                border-radius: 3px;
                font-family: monospace;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🌱 AgriVision Pro Backend API</h1>
            <p>Comprehensive Agricultural Management Platform</p>
            <span class="status success">✅ Online & Operational</span>
        </div>

        <div class="section">
            <h2>📋 Application Overview</h2>
            <p><strong>Version:</strong> ${appInfo.version}</p>
            <p><strong>Environment:</strong> ${appInfo.environment}</p>
            <p><strong>Description:</strong> ${appInfo.description}</p>
            
            <h3>🚀 Key Features</h3>
            <ul>
                ${appInfo.application.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>🔗 API Endpoints</h2>
            
            ${Object.entries(appInfo.apiRoutes).map(([key, value]) => `
            <h3>${value.basePath}</h3>
            ${value.endpoints.map((endpoint) => `
            <div class="endpoint">
                <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                <code>${value.basePath}${endpoint.path}</code>
                <p style="margin: 0.5rem 0 0 0; color: #666;">${endpoint.description}</p>
            </div>
            `).join('')}
            `).join('')}
        </div>

        <div class="section">
            <h2>⚙️ Configuration Status</h2>
            <p><strong>Port:</strong> ${appInfo.configuration.port}</p>
            <p><strong>Database:</strong> <span class="status ${appInfo.configuration.databaseConnected ? 'success' : 'info'}">${appInfo.configuration.databaseConnected ? 'Connected' : 'Disconnected'}</span></p>
            <p><strong>S3 Storage:</strong> <span class="status ${appInfo.configuration.s3Configured ? 'success' : 'info'}">${appInfo.configuration.s3Configured ? 'Configured' : 'Not Configured'}</span></p>
            <p><strong>AI Service:</strong> <span class="status ${appInfo.configuration.aiConfigured ? 'success' : 'info'}">${appInfo.configuration.aiConfigured ? 'Configured' : 'Not Configured'}</span></p>
        </div>

        <div class="section">
            <h2>💻 Technology Stack</h2>
            <ul>
                ${Object.entries(appInfo.technologyStack).map(([key, value]) => `<li><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>🏥 Health Check</h2>
            <p>Endpoint: <code>${appInfo.healthCheck.endpoint}</code></p>
            <p>Method: <code>${appInfo.healthCheck.method}</code></p>
            <p>${appInfo.healthCheck.description}</p>
        </div>

        <div class="section">
            <h2>ℹ️ Server Information</h2>
            <p><strong>Uptime:</strong> ${Math.floor(appInfo.serverInfo.uptime / 3600)} hours, ${Math.floor((appInfo.serverInfo.uptime % 3600) / 60)} minutes</p>
            <p><strong>Platform:</strong> ${appInfo.serverInfo.platform}</p>
            <p><strong>Node Version:</strong> ${appInfo.serverInfo.nodeVersion}</p>
            <p><strong>Process ID:</strong> ${appInfo.serverInfo.pid}</p>
        </div>

        <div class="section">
            <h2>📞 Support</h2>
            <p>For technical support or questions about the API, please contact the development team.</p>
        </div>
    </body>
    </html>
    `;
        res.status(200).send(htmlResponse);
    }
    else {
        // JSON response for API consumers
        res.status(200).json(appInfo);
    }
};
exports.getHomeInfo = getHomeInfo;
//# sourceMappingURL=homeController.js.map