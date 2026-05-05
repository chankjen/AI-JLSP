# AI-JLSP Monorepo Structure

## Directory Tree

```
AI-JLSP/
├── packages/
│   ├── frontend/                          # Next.js 14 with RBAC & JWT
│   │   ├── app/                           # App Router structure
│   │   ├── components/                    # React components
│   │   ├── lib/                           # Utilities (auth, api, theme)
│   │   ├── hooks/                         # Custom React hooks
│   │   ├── middleware/                    # RBAC & JWT middleware
│   │   ├── public/                        # Static assets
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   ├── backend/                           # Node.js/Express CRUD, Auth, RBAC
│   │   ├── src/
│   │   │   ├── routes/                    # API endpoints
│   │   │   ├── middleware/                # JWT, RBAC, audit logging
│   │   │   ├── db/                        # PostgreSQL schema, migrations
│   │   │   ├── services/                  # Business logic
│   │   │   └── app.ts                     # Express app entry
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   ├── ai-service/                        # FastAPI AI/ML Microservice
│   │   ├── app/
│   │   │   ├── main.py                    # FastAPI app
│   │   │   └── routes/                    # AI endpoints
│   │   ├── models/                        # Legal-BERT-KE, embedding models
│   │   ├── pipelines/                     # RAG, document validation
│   │   ├── config/                        # Settings, model paths
│   │   ├── requirements.txt
│   │   └── .env.example
│   │
│   └── shared/                            # Shared types, constants, policies
│       ├── types/
│       │   ├── rbac.ts                    # RBAC role/permission types
│       │   ├── api.ts                     # Common API types
│       │   └── audit.ts                   # Audit log types
│       ├── constants/
│       │   ├── roles.ts                   # Role definitions
│       │   ├── modules.ts                 # Module definitions
│       │   └── permissions.ts             # Permission definitions
│       └── package.json
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.frontend            # Multi-stage Next.js build
│   │   ├── Dockerfile.backend             # Node.js/Express
│   │   ├── Dockerfile.ai-service          # FastAPI with Python 3.11
│   │   └── Dockerfile.postgres            # Custom PostgreSQL init scripts
│   │
│   ├── k8s/                               # Kubernetes manifests (future)
│   │   ├── frontend-deployment.yaml
│   │   ├── backend-deployment.yaml
│   │   ├── ai-service-deployment.yaml
│   │   ├── postgres-statefulset.yaml
│   │   ├── redis-deployment.yaml
│   │   └── qdrant-deployment.yaml
│   │
│   ├── docker-compose.yml                 # Local dev environment
│   └── init-scripts/
│       ├── postgres-init.sql              # Schema & audit table creation
│       └── redis-init.conf                # Redis configuration
│
├── scripts/
│   ├── init-db.sh                         # Initialize databases
│   ├── seed-roles.sh                      # Seed RBAC roles
│   ├── generate-keys.sh                   # Generate JWT keys
│   └── build-images.sh                    # Build Docker images
│
├── .env.example                           # Root environment template
├── .gitignore
├── docker-compose.yml                     # Root compose file
├── package.json                           # Root monorepo config
├── PRD.md                                 # Product Requirements
├── TRD.md                                 # Technical Requirements
├── COMPLIANCE.md                          # DPA/Constitution mapping
├── RBAC-POLICY.md                         # Role-Action-Module matrix
└── README.md                              # Setup & run instructions
```

## Key Files Overview

| File | Purpose | Compliance Anchor |
|------|---------|-------------------|
| `RBAC-POLICY.md` | Role → Module → Action matrix | Constitution Art 47 (Fair Admin Action) |
| `packages/backend/src/db/audit-schema.sql` | Immutable audit logs + hash chain | DPA Sec 31, Art 47 |
| `packages/backend/src/middleware/rbac.ts` | JWT + RBAC enforcement | JWT + Constitution |
| `packages/shared/constants/roles.ts` | 7 roles (Advocate, TDR Officer, etc.) | KRA Act, DPA |
| `docker-compose.yml` | PostgreSQL, Redis, Qdrant, services | Data Sovereignty |
| `infrastructure/docker/*` | AES-256 @ rest, TLS 1.3 in transit | DPA Sec 26 |
| `.env.example` | Secrets template (JWT_SECRET, DB_ENCRYPTION_KEY) | DPA Sec 25 |

