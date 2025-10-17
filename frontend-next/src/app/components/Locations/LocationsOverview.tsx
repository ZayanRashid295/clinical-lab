import React, { useState } from "react";
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Clock,
  Star,
  Filter,
  Download,
  RefreshCw,
  Navigation,
  Home,
  Building,
  Heart,
  ShoppingBag,
} from "lucide-react";
import { LocationData } from "../../types/location";
import { MOCK_LOCATIONS } from "../../../data/mockData";

const LocationsOverview: React.FC = () => {
  // Calculate overview statistics
  const totalLocations = MOCK_LOCATIONS.length;
  const pickupLocations = MOCK_LOCATIONS.filter(
    (loc) => loc.type === "PICKUP"
  ).length;
  const dropoffLocations = MOCK_LOCATIONS.filter(
    (loc) => loc.type === "DROPOFF"
  ).length;
  const favoriteLocations = MOCK_LOCATIONS.filter(
    (loc) => loc.type === "FAVORITE"
  ).length;

  const avgPopularity = Math.round(
    MOCK_LOCATIONS.reduce(
      (sum, loc) => sum + (loc.metadata?.popularity || 0),
      0
    ) / MOCK_LOCATIONS.length
  );

  const topCategories = Array.from(
    new Set(MOCK_LOCATIONS.map((loc) => loc.metadata?.category).filter(Boolean))
  )
    .map((category) => ({
      name: category!,
      count: MOCK_LOCATIONS.filter((loc) => loc.metadata?.category === category)
        .length,
      avgPopularity: Math.round(
        MOCK_LOCATIONS.filter(
          (loc) => loc.metadata?.category === category
        ).reduce((sum, loc) => sum + (loc.metadata?.popularity || 0), 0) /
          MOCK_LOCATIONS.filter((loc) => loc.metadata?.category === category)
            .length
      ),
    }))
    .sort((a, b) => b.avgPopularity - a.avgPopularity);

  const recentLocations = MOCK_LOCATIONS.filter(
    (loc) => loc.metadata?.popularity
  )
    .sort(
      (a, b) => (b.metadata?.popularity || 0) - (a.metadata?.popularity || 0)
    )
    .slice(0, 6);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Business District":
      case "Business":
        return <Building size={16} className="text-blue-600" />;
      case "Educational":
        return <Users size={16} className="text-green-600" />;
      case "Transportation Hub":
      case "Transportation":
        return <Navigation size={16} className="text-purple-600" />;
      case "Shopping":
        return <ShoppingBag size={16} className="text-orange-600" />;
      case "Healthcare":
        return <Heart size={16} className="text-red-600" />;
      case "Residential":
        return <Home size={16} className="text-gray-600" />;
      default:
        return <MapPin size={16} className="text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Business District":
      case "Business":
        return "bg-blue-100 text-blue-800";
      case "Educational":
        return "bg-green-100 text-green-800";
      case "Transportation Hub":
      case "Transportation":
        return "bg-purple-100 text-purple-800";
      case "Shopping":
        return "bg-orange-100 text-orange-800";
      case "Healthcare":
        return "bg-red-100 text-red-800";
      case "Residential":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 90) return "text-red-600";
    if (popularity >= 80) return "text-orange-600";
    if (popularity >= 70) return "text-yellow-600";
    return "text-gray-600";
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Locations Overview
            </h2>
            <p className="text-sm text-gray-500">
              Manage and monitor all location data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <RefreshCw size={20} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Locations</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalLocations}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin size={20} className="text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp size={14} className="text-green-600" />
              <span className="text-sm text-green-600 ml-1">
                +12% from last month
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pickup Locations</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {pickupLocations}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp size={20} className="text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp size={14} className="text-green-600" />
              <span className="text-sm text-green-600 ml-1">
                +8% from last month
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Drop-off Locations</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dropoffLocations}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingDown size={20} className="text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingDown size={14} className="text-red-600" />
              <span className="text-sm text-red-600 ml-1">
                -3% from last month
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Favorite Locations</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {favoriteLocations}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star size={20} className="text-yellow-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp size={14} className="text-green-600" />
              <span className="text-sm text-green-600 ml-1">
                +15% from last month
              </span>
            </div>
          </div>
        </div>

        {/* Categories and Recent Locations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Categories */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Location Categories
            </h3>
            <div className="space-y-3">
              {topCategories.map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getCategoryColor(
                        category.name
                      )}`}
                    >
                      {getCategoryIcon(category.name)}
                      {category.name}
                    </span>
                    <span className="text-sm text-gray-600">
                      {category.count} locations
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${getPopularityColor(
                        category.avgPopularity
                      )}`}
                    >
                      {category.avgPopularity}%
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${category.avgPopularity}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Locations */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Popular Locations
            </h3>
            <div className="space-y-3">
              {recentLocations.map((location, index) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {location.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {location.metadata?.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${getPopularityColor(
                        location.metadata?.popularity || 0
                      )}`}
                    >
                      {location.metadata?.popularity || 0}%
                    </span>
                    <div className="w-12 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${location.metadata?.popularity || 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationsOverview;
