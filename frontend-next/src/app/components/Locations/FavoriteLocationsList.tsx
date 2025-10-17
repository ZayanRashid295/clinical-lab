import React, { useState } from "react";
import {
  MapPin,
  Search,
  Filter,
  Plus,
  Navigation,
  Star,
  Clock,
  Users,
  TrendingUp,
  MoreVertical,
  ExternalLink,
  Home,
  Building,
  Heart,
  Trash2,
  Edit,
} from "lucide-react";
import { LocationData, LocationType } from "../../types/location";
import { MOCK_LOCATIONS } from "../../../data/mockData";

interface FavoriteLocationsListProps {
  onLocationSelect?: (location: LocationData) => void;
  selectedLocationId?: string;
}

const FavoriteLocationsList: React.FC<FavoriteLocationsListProps> = ({
  onLocationSelect,
  selectedLocationId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  // Filter to only show favorite locations for current user (assuming user ID "1")
  const favoriteLocations = MOCK_LOCATIONS.filter(
    (location) => location.type === "FAVORITE" && location.userId === "1"
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Residential":
        return <Home size={16} className="text-blue-600" />;
      case "Business":
        return <Building size={16} className="text-green-600" />;
      case "Healthcare":
        return <Heart size={16} className="text-red-600" />;
      default:
        return <Star size={16} className="text-yellow-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Residential":
        return "bg-blue-100 text-blue-800";
      case "Business":
        return "bg-green-100 text-green-800";
      case "Healthcare":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const filteredLocations = favoriteLocations.filter((location) => {
    const matchesSearch =
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterCategory === "ALL" ||
      location.metadata?.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const categories = Array.from(
    new Set(
      favoriteLocations.map((loc) => loc.metadata?.category).filter(Boolean)
    )
  );

  const totalLocations = favoriteLocations.length;

  const handleDeleteFavorite = (locationId: string) => {
    console.log("Delete favorite location:", locationId);
    // TODO: Implement delete functionality
  };

  const handleEditFavorite = (location: LocationData) => {
    console.log("Edit favorite location:", location);
    // TODO: Implement edit functionality
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Favorite Locations
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-gray-500">
                {totalLocations} saved locations
              </p>
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-500" />
                <span className="text-sm text-gray-500">
                  Personal favorites
                </span>
              </div>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Plus size={20} />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search favorite locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory("ALL")}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filterCategory === "ALL"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category!)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filterCategory === category
                    ? getCategoryColor(category!)
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Locations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Star size={48} className="mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">
              No favorite locations found
            </h3>
            <p className="text-sm text-center">
              {searchTerm || filterCategory !== "ALL"
                ? "Try adjusting your search or filter"
                : "Save your frequently visited locations to see them here"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                onClick={() => onLocationSelect?.(location)}
                className={`p-4 rounded-lg cursor-pointer transition-colors mb-2 border ${
                  selectedLocationId === location.id
                    ? "bg-yellow-50 border-yellow-200"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-yellow-100 rounded-lg">
                    <Star size={20} className="text-yellow-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {location.name}
                      </h3>
                      <div className="flex items-center gap-2 ml-2">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-500" />
                          <span className="text-xs text-gray-500">
                            Favorite
                          </span>
                        </div>
                        <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {location.address}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      {location.metadata?.category && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getCategoryColor(
                            location.metadata.category
                          )}`}
                        >
                          {getCategoryIcon(location.metadata.category)}
                          {location.metadata.category}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        Saved Location
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
                          window.open(mapsUrl, "_blank");
                        }}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink size={12} />
                        View on Maps
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Navigate to:", location.name);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 transition-colors"
                      >
                        <Navigation size={12} />
                        Navigate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFavorite(location);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <Edit size={12} />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFavorite(location.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoriteLocationsList;
