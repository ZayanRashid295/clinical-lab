"use client";

import React, { useState } from "react";

const LanguageTest2Page: React.FC = () => {
  const [isRTL, setIsRTL] = useState(false);

  const toggleDirection = () => {
    setIsRTL(!isRTL);
  };

  const buttonData = [
    {
      icon: "🏠",
      textEn: "Home",
      textAr: "الرئيسية",
      isPrimary: true,
    },
    {
      icon: "👤",
      textEn: "Profile",
      textAr: "الملف الشخصي",
      isPrimary: false,
    },
    {
      icon: "⚙️",
      textEn: "Settings",
      textAr: "الإعدادات",
      isPrimary: false,
    },
    {
      icon: "💬",
      textEn: "Messages",
      textAr: "الرسائل",
      isPrimary: false,
    },
    {
      icon: "🚪",
      textEn: "Logout",
      textAr: "تسجيل الخروج",
      isPrimary: false,
    },
    {
      icon: "📊",
      textEn: "Reports",
      textAr: "التقارير",
      isPrimary: false,
    },
    {
      icon: "📅",
      textEn: "Calendar",
      textAr: "التقويم",
      isPrimary: false,
    },
  ];

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-500 to-purple-600 p-5">
      <div
        className={`bg-white rounded-3xl p-10 shadow-2xl max-w-4xl w-full transition-all duration-300 ${
          isRTL ? "font-arabic" : "font-sans"
        }`}
        dir={isRTL ? "rtl" : "ltr"}
        lang={isRTL ? "ar" : "en"}
      >
        <h1
          className={`text-gray-800 mb-2 text-3xl font-bold transition-all duration-300 ${
            isRTL ? "text-right" : "text-left"
          }`}
        >
          {isRTL ? "عرض تخطيط الأزرار" : "Button Layout Demo"}
        </h1>

        <p
          className={`text-gray-600 mb-8 text-sm transition-all duration-300 ${
            isRTL ? "text-right" : "text-left"
          }`}
        >
          {isRTL
            ? "الأيقونات والنص تتماشى بناءً على الاتجاه"
            : "Icons and text align based on direction"}
        </p>

        <div className="flex justify-center mb-8">
          <button
            onClick={toggleDirection}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 py-3 px-6 rounded-full text-base font-semibold cursor-pointer flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="text-lg">{isRTL ? "↔️" : "↔️"}</span>
            <span className="lang-switch">
              {isRTL
                ? "التبديل إلى الإنجليزية (LTR)"
                : "Switch to Arabic (RTL)"}
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {buttonData.map((button, index) => (
            <button
              key={index}
              className={`bg-gray-50 border-2 border-gray-200 py-4 px-6 rounded-xl text-base cursor-pointer flex items-center gap-3 transition-all duration-300 text-gray-800 font-medium w-full relative hover:bg-gray-100 hover:border-gray-300 ${
                isRTL
                  ? "hover:-translate-x-1 pl-12 pr-6 justify-end text-right"
                  : "hover:translate-x-1 pr-12 pl-6 justify-start text-left"
              } ${
                button.isPrimary
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg"
                  : ""
              }`}
              style={{
                animation: `slideIn 0.4s ease forwards`,
                animationDelay: `${(index + 1) * 0.1}s`,
                opacity: 0,
              }}
            >
              <span className="text-lg">{button.icon}</span>
              <span className="flex-1">
                {isRTL ? button.textAr : button.textEn}
              </span>
              <span
                className={`text-sm opacity-50 transition-all duration-300 absolute top-1/2 -translate-y-1/2 ${
                  isRTL ? "left-5 right-auto" : "right-5 left-auto"
                }`}
              >
                {isRTL ? "◀" : "▶"}
              </span>
            </button>
          ))}
        </div>

        <div className="text-center py-3 bg-gray-50 rounded-lg text-gray-600 text-sm mt-5">
          {isRTL ? (
            <>
              الاتجاه الحالي:{" "}
              <strong>RTL (من اليمين إلى اليسار) - العربية</strong>
            </>
          ) : (
            <>
              Current Direction: <strong>LTR (Left-to-Right) - English</strong>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .font-arabic {
          font-family: "Cairo", "Noto Sans Arabic", "Tahoma", "Arial",
            sans-serif;
        }

        .icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .flip-rtl {
          transform: scaleX(-1);
        }

        .caret {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
        }

        .lang-switch {
          display: inline-block;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default LanguageTest2Page;
