# Replit.md

## Overview

This is a minimal email open tracking service built with a modern TypeScript stack. The application provides a simple API to create unique tracking pixels and monitor when they are opened, perfect for email marketing tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Storage**: In-memory storage (MemStorage class) for development
- **No Database**: Simple in-memory tracking for minimal setup

### Project Structure
- `/client` - React frontend application
- `/server` - Express.js backend API
- `/shared` - Shared TypeScript schemas and types

## Key Components

### Data Schema
- **TrackingPixel Interface**: Simple tracking data structure with id, timestamps, and status
- **Minimal Storage**: In-memory storage with unique tracking IDs

### API Endpoints
- `GET /api/pixel/create` - Creates unique tracking pixel with embed code
- `GET /api/pixel/:id` - Serves 1x1 transparent GIF and marks pixel as opened
- `POST /api/pixel/check` - Checks if a specific pixel has been opened
- `GET /api/dashboard` - Returns stats and recent pixel activity

### Frontend Features
- **Attractive Hero Section**: Gradient background with cute email SVG and feature highlights
- **Enhanced Dashboard**: Modern glass-morphism design with hover effects
- **Colorful Statistics**: 5 beautiful stat cards with colored icons and animations
- **Pixel Creation**: Gradient buttons with icons and loading states
- **Status Checking**: Real-time pixel open status monitoring with improved UX
- **Recent Activity**: Styled pixel cards with emojis and detailed tracking info
- **Time Tracking Display**: Shows view counts, duration, and last seen timestamps

## Data Flow

1. **Pixel Creation**: Generate unique tracking ID via GET request
2. **Embed**: Use provided HTML embed code in emails
3. **Tracking**: When email opens, pixel loads and marks as opened
4. **Monitoring**: Dashboard shows real-time open statistics

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Powerful data synchronization for React
- **@radix-ui/***: Headless UI components for accessibility
- **lucide-react**: Icon library for UI components

### Development Tools
- **tsx**: TypeScript execution for development
- **vite**: Fast bundling and development server

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with auto-restart
- **Storage**: In-memory storage for immediate testing

### Production
- **Frontend**: Static build served from `/dist/public`
- **Backend**: Express server serving API and static files
- **Environment**: Works out of the box without external dependencies

### Tracking Implementation
- 1x1 transparent GIF pixel tracking
- Unique UUID generation for each pixel
- Real-time status updates via in-memory storage
- Console logging for tracking events