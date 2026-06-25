-- Sprint 23: half-bathrooms and square_feet pricing parameter types
ALTER TYPE "PricingParameterType" ADD VALUE IF NOT EXISTS 'half_bathrooms';
ALTER TYPE "PricingParameterType" ADD VALUE IF NOT EXISTS 'square_feet';
