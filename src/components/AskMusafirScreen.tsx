import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUp,
  MapPin,
  Clock,
  Calendar,
  Utensils,
  Navigation,
  Compass,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { LocationData, PrayerTimesData, Place, ChatMessage, TripGuide } from '../types';
import { MarkdownMessage } from './MarkdownMessage';

interface AskMusafirScreenProps {
  location: LocationData;
  prayerTimes: PrayerTimesData;
  onBack: () => void;
  onNavigateExplore?: (cat: 'mosque' | 'halal') => void;
  onNavigateTrip?: () => void;
  onSelectPlace?: (place: Place) => void;
  tripGuide?: TripGuide | null;
  onUpdateTripGuide?: (guide: TripGuide) => void;
}

export const AskMusafirScreen: React.FC<AskMusafirScreenProps> = ({
  location,
  prayerTimes,
  onBack,
  onNavigateExplore,
  onNavigateTrip,
  onSelectPlace,
  tripGuide,
  onUpdateTripGuide,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
          location: {
            name: location.name,
            lat: location.lat,
            lng: location.lng,
          },
          prayerContext: {
            fajr: prayerTimes.fajr,
            sunrise: prayerTimes.sunrise,
            dhuhr: prayerTimes.dhuhr,
            asr: prayerTimes.asr,
            maghrib: prayerTimes.maghrib,
            isha: prayerTimes.isha,
            nextPrayerName: prayerTimes.nextPrayer,
            nextPrayerTime: prayerTimes.nextPrayerTime,
          },
          tripContext: tripGuide,
        }),
      });

      if (!res.ok) {
        throw new Error('Network error');
      }

      const data = await res.json();

      // If trip was updated by AI, update parent trip state
      if (data.updatedGuide && onUpdateTripGuide) {
        onUpdateTripGuide(data.updatedGuide);
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        card: data.card,
        tripAction: data.tripAction,
        actions: tripGuide ? ['What is next on my trip?', 'Find halal food nearby', 'View Trip Guide'] : ['Halal food nearby', 'Add to my trip'],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      // Offline fallback handling
      const lower = text.toLowerCase();
      let fallbackText = `Assalamu alaikum! In ${location.name}, prayer times and Qibla are saved offline.`;
      let fallbackCard: any = null;
      let fallbackTripAction: any = null;

      if (lower.includes('running late') || lower.includes('late')) {
        fallbackText = `I've adjusted your trip schedule forward by 30 minutes. Your timeline is updated.`;
        fallbackTripAction = {
          action: 'delayed',
          description: 'Shifted schedule forward by 30 minutes.',
        };
      } else if (lower.includes('what next') || lower.includes("what's next")) {
        if (tripGuide?.days?.[0]?.stops?.[0]) {
          const nextStop = tripGuide.days[0].stops.find((s) => s.status === 'upcoming') || tripGuide.days[0].stops[0];
          fallbackText = `Your next stop is **${nextStop.title}** at **${nextStop.time}** (${nextStop.subtitle}).`;
        } else {
          fallbackText = `Your next activity is set in the Trip Guide.`;
        }
      } else if (lower.includes('Jama') || lower.includes('Qasr')) {
        fallbackText = `Yes, Sice you plan to Dubai trip its suitable for your trip. 
        Whether you can combine (Jama') and shorten (Qasr) your prayers depends on your travel status according to Islamic jurisprudence.

To qualify for these concessions, you must meet the following criteria:

Distance: You must be traveling a distance that is traditionally considered a "journey" (Safar). Most scholars define this as approximately 77–80 kilometers (48–50 miles) or more from your home city.
Intent: You must have the intention to travel this distance before you depart.
Duration: You must intend to stay at your destination for less than 15 days (according to the Hanafi school) or less than 4 days (according to the Shafi'i, Maliki, and Hanbali schools). If you intend to stay longer, you are considered a resident and must pray fully.
`;
        
      } else if (lower.includes('halal') || lower.includes('dinner')) {
        fallbackText = `Al Mandi House is 250 m away with authentic Yemeni mandi, 100% Halal certified. Beirut Grill is also 600 m away with family seating.`;
        fallbackCard = {
          type: 'food',
          title: 'Al Mandi House',
          subtitle: '250 m · 3 min walk · Halal certified',
        };
      } else if (lower.includes('maghrib')) {
        fallbackText = `Maghrib today in ${location.name} is at ${prayerTimes.maghrib}. Asr is at ${prayerTimes.asr}.`;
      }

      const fallbackMsg: ChatMessage = {
        id: `assistant-fallback-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        card: fallbackCard,
        tripAction: fallbackTripAction,
        actions: ['Halal food nearby', 'Add to my trip'],
      };

      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: string) => {
    if (action.includes('Halal food')) {
      if (onNavigateExplore) onNavigateExplore('halal');
      else handleSendMessage('Find halal food nearby');
    } else if (action.includes('View Trip Guide') || action.includes('Add to my trip')) {
      if (onNavigateTrip) onNavigateTrip();
      else handleSendMessage('Plan a prayer-friendly Day 2');
    } else {
      handleSendMessage(action);
    }
  };

  const suggestionCards = tripGuide?.days?.length
    ? [
        {
          title: "Is Jama’ and Qasr suitable in my trip?",
          icon: (
            <div className="w-8 h-8 rounded-xl bg-[#E3F1ED] flex items-center justify-center text-[#0F5C4D]">
              <Compass className="w-4 h-4" />
            </div>
          ),
          query: "Is Jama’ and Qasr suitable in my trip?",
        },
        {
          title: "I'm running 30 minutes late",
          icon: (
            <div className="w-8 h-8 rounded-xl bg-[#FBF3DE] flex items-center justify-center text-[#C9A24B]">
              <Clock className="w-4 h-4" />
            </div>
          ),
          query: "I'm running 30 minutes late, adjust my schedule",
        },
        {
          title: 'Where am I having lunch today?',
          icon: (
            <div className="w-8 h-8 rounded-xl bg-[#E3F1ED] flex items-center justify-center text-[#0F5C4D]">
              <Utensils className="w-4 h-4" />
            </div>
          ),
          query: 'Where am I having lunch today according to my trip guide?',
        },
        {
          title: 'Skip my next activity',
          icon: (
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Calendar className="w-4 h-4" />
            </div>
          ),
          query: 'Skip my next activity and update the timeline',
        },
      ]
    : [
        {
          title: 'Is Jama’ and Qasr suitable in my trip',
          icon: (
            <div className="w-8 h-8 rounded-xl bg-[#E3F1ED] flex items-center justify-center text-[#0F5C4D]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
          ),
          query: 'Is Jama’ and Qasr suitable in my trip',
        },
        {
          title: 'Find halal dinner near my hotel',
          icon: (
            <div className="w-8 h-8 rounded-xl bg-[#E3F1ED] flex items-center justify-center text-[#0F5C4D]">
              <Utensils className="w-4 h-4" />
            </div>
          ),
          query: 'Find halal dinner near my hotel',
        },
        {
          title: 'What time is Maghrib today?',
          icon: (
            <div className="w-8 h-8 rounded-xl bg-[#E3F1ED] flex items-center justify-center text-[#0F5C4D]">
              <Clock className="w-4 h-4" />
            </div>
          ),
          query: 'What time is Maghrib today?',
        },
        {
          title: 'Plan a prayer-friendly trip',
          icon: (
            <div className="w-8 h-8 rounded-xl bg-[#E3F1ED] flex items-center justify-center text-[#0F5C4D]">
              <Calendar className="w-4 h-4" />
            </div>
          ),
          query: 'Help me plan a 3-day Muslim travel guide with prayer times',
        },
      ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] justify-between bg-[#F7F5EF] animate-fade-in">
      {/* Top Header */}
      <div className="p-4 sm:p-5 bg-white border-b border-[#E4E8E5] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#F7F5EF] border border-[#E4E8E5] flex items-center justify-center text-[#14211F] hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#14211F]">Ask Musafir</h1>
            <div className="flex items-center gap-1.5 text-xs text-[#5E6E6A]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online · AI travel assistant</span>
            </div>
          </div>
        </div>

        {tripGuide?.destination && onNavigateTrip && (
          <button
            onClick={onNavigateTrip}
            className="py-1 px-2.5 rounded-full bg-[#E3F1ED] hover:bg-[#0F5C4D] hover:text-white text-[#0F5C4D] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Open active trip guide"
          >
            <Compass className="w-3 h-3" />
            <span>{tripGuide.destination.name.split(',')[0]}</span>
          </button>
        )}
      </div>

      {/* Main Content: Welcome State OR Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.length === 0 ? (
          /* Welcome State (Screen 9) */
          <div className="py-4 flex flex-col items-center text-center max-w-sm mx-auto">
            {/* Sparkle badge */}
            <div className="w-16 h-16 rounded-3xl bg-[#E3F1ED] flex items-center justify-center text-[#0F5C4D] mb-4">
              <Sparkles className="w-8 h-8 text-[#0F5C4D]" />
            </div>

            <h2 className="text-xl font-bold text-[#14211F] mb-1.5">
              Ask me anything about your trip
            </h2>
            <p className="text-xs sm:text-sm text-[#5E6E6A] leading-relaxed mb-6">
              Prayer times, halal food, mosques, directions and local tips.
            </p>

            <div className="w-full text-left">
              <div className="text-xs font-semibold text-[#5E6E6A] uppercase tracking-wider mb-2.5 px-1">
                Try asking
              </div>

              <div className="space-y-2.5">
                {suggestionCards.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.query)}
                    className="w-full p-3.5 bg-white rounded-2xl border border-[#E4E8E5] hover:border-[#0F5C4D]/40 flex items-center justify-between text-left transition-all hover:shadow-2xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="text-sm font-semibold text-[#14211F] group-hover:text-[#0F5C4D]">
                        {item.title}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#5E6E6A] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Chat Conversation Stream (Screen 10) */
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                {msg.sender === 'user' ? (
                  /* User message */
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-[#0F5C4D] text-white p-3.5 rounded-2xl rounded-tr-xs text-sm font-medium leading-relaxed shadow-2xs">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  /* Assistant message */
                  <div className="flex items-start gap-2.5 max-w-[95%]">
                    <div className="w-7 h-7 rounded-full bg-[#E3F1ED] flex items-center justify-center shrink-0 mt-0.5 text-[#0F5C4D]">
                      <Sparkles className="w-3.5 h-3.5 text-[#0F5C4D]" />
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {/* Text bubble */}
                      <div className="bg-white border border-[#E4E8E5] text-[#14211F] p-3.5 rounded-2xl rounded-tl-xs shadow-2xs">
                        <MarkdownMessage content={msg.text} />
                      </div>

                      {/* Interactive Trip Action Card */}
                      {msg.tripAction && (
                        <div className="bg-[#E3F1ED] p-3.5 rounded-2xl border border-[#0F5C4D]/25 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#0F5C4D]">
                              <CheckCircle2 className="w-4 h-4 text-[#0F5C4D]" />
                              <span>Trip Guide Updated</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F5C4D]/70 bg-white/70 px-2 py-0.5 rounded-full">
                              {msg.tripAction.action}
                            </span>
                          </div>

                          <p className="text-xs text-[#14211F] font-medium leading-relaxed">
                            {msg.tripAction.description}
                          </p>

                          {onNavigateTrip && (
                            <button
                              type="button"
                              onClick={onNavigateTrip}
                              className="w-full py-2 px-3 rounded-xl bg-[#0F5C4D] hover:bg-[#0A4237] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                              <span>Open Trip Guide Timeline</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* In-chat contextual place card */}
                      {msg.card && (
                        <div className="bg-white p-3 rounded-2xl border border-[#E4E8E5] flex items-center justify-between shadow-2xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[#E3F1ED] flex items-center justify-center text-[#0F5C4D]">
                              {msg.card.type === 'mosque' ? (
                                <svg
                                  className="w-4 h-4 fill-current"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                >
                                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                                </svg>
                              ) : (
                                <Utensils className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[#14211F]">
                                {msg.card.title}
                              </div>
                              <div className="text-xs text-[#5E6E6A]">
                                {msg.card.subtitle}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const uri =
                                msg.card?.googleMapsUri ||
                                msg.card?.place?.googleMapsUri ||
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  msg.card?.title || ''
                                )}`;
                              window.open(uri, '_blank');
                            }}
                            className="w-8 h-8 rounded-full bg-[#0F5C4D] text-white flex items-center justify-center cursor-pointer hover:bg-[#0A4237] shadow-2xs"
                            title="Open directions in Google Maps"
                          >
                            <Navigation className="w-3.5 h-3.5 fill-white" />
                          </button>
                        </div>
                      )}

                      {/* Contextual Action Chips */}
                      {msg.actions && (
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          {msg.actions.map((act, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                if (act === 'Add to my trip' && msg.card?.place && onSelectPlace) {
                                  onSelectPlace(msg.card.place);
                                } else {
                                  handleActionClick(act);
                                }
                              }}
                              className="py-1.5 px-3 rounded-full bg-white border border-[#0F5C4D]/30 hover:border-[#0F5C4D] text-[#0F5C4D] text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                            >
                              {act}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Offline reminder note */}
                      <p className="text-[11px] text-[#5E6E6A] pt-1">
                        Offline? I can still answer prayer times and Qibla.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#5E6E6A] p-2">
                <span className="w-2 h-2 rounded-full bg-[#0F5C4D] animate-ping" />
                <span>Musafir is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Input Field & Legal Disclaimer */}
      <div className="p-4 bg-white border-t border-[#E4E8E5] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about your trip…"
            className="flex-1 py-3 px-4 rounded-full bg-[#F7F5EF] text-sm text-[#14211F] placeholder:text-[#5E6E6A]/70 border border-[#E4E8E5] focus:outline-none focus:border-[#0F5C4D]"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-11 h-11 rounded-full bg-[#0F5C4D] disabled:bg-slate-300 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            aria-label="Send message"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </button>
        </form>

        <p className="text-[11px] text-[#5E6E6A] text-center mt-2.5">
          AI can make mistakes. Confirm prayer times with a local mosque.
        </p>
      </div>
    </div>
  );
};
