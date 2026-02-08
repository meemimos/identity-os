import { useEffect, useRef, useLayoutEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Sparkles, 
  Brain, 
  Calendar, 
  RefreshCw, 
  TrendingUp, 
  Shield,
  X,
  Mail,
  Phone,
  MapPin,
  Send
} from 'lucide-react';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section4Ref = useRef<HTMLDivElement>(null);
  const section5Ref = useRef<HTMLDivElement>(null);
  const section6Ref = useRef<HTMLDivElement>(null);
  const section7Ref = useRef<HTMLDivElement>(null);

  // Hero load animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.2 });
      
      tl.fromTo('.hero-bg-image', 
        { opacity: 0, scale: 1.1 }, 
        { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }
      )
      .fromTo('.hero-orb', 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.8'
      )
      .fromTo('.hero-portrait',
        { y: 60, scale: 0.92, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 1, ease: 'power3.out' },
        '-=0.5'
      )
      .fromTo('.hero-headline span',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: 'power3.out' },
        '-=0.6'
      )
      .fromTo('.hero-subheadline',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      )
      .fromTo('.hero-cta',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.3'
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Scroll animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero scroll exit animation with parallax background
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: '+=130%',
        pin: true,
        scrub: 0.6,
        onLeaveBack: () => {
          gsap.set('.hero-portrait, .hero-headline, .hero-subheadline, .hero-cta', {
            opacity: 1, x: 0, y: 0, scale: 1
          });
        }
      });

      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '+=130%',
          scrub: 0.6,
        }
      });

      heroTl
        .fromTo('.hero-bg-image',
          { y: 0, scale: 1 },
          { y: '-15%', scale: 1.1, ease: 'none' },
          0
        )
        .fromTo('.hero-portrait',
          { x: 0, y: 0, scale: 1, opacity: 1 },
          { x: '-28vw', y: '10vh', scale: 0.92, opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo('.hero-headline',
          { y: 0, opacity: 1 },
          { y: '-10vh', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo('.hero-subheadline',
          { y: 0, opacity: 1 },
          { y: '-8vh', opacity: 0, ease: 'power2.in' },
          0.72
        )
        .fromTo('.hero-cta',
          { y: 0, opacity: 1 },
          { y: '6vh', opacity: 0, ease: 'power2.in' },
          0.75
        );

      // Section 2: Not a Chatbot with background
      ScrollTrigger.create({
        trigger: section2Ref.current,
        start: 'top top',
        end: '+=130%',
        pin: true,
        scrub: 0.6,
      });

      const section2Tl = gsap.timeline({
        scrollTrigger: {
          trigger: section2Ref.current,
          start: 'top top',
          end: '+=130%',
          scrub: 0.6,
        }
      });

      section2Tl
        .fromTo('.s2-bg-image',
          { x: '10%', opacity: 0 },
          { x: 0, opacity: 0.6, ease: 'none' },
          0
        )
        .fromTo('.s2-headline',
          { x: '60vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo('.s2-subline',
          { y: '10vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.05
        )
        .to('.s2-bg-image',
          { x: '-10%', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .to('.s2-headline',
          { x: '-55vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .to('.s2-subline',
          { y: '8vh', opacity: 0, ease: 'power2.in' },
          0.72
        );

      // Section 3: Not a Scheduler with background
      ScrollTrigger.create({
        trigger: section3Ref.current,
        start: 'top top',
        end: '+=130%',
        pin: true,
        scrub: 0.6,
      });

      const section3Tl = gsap.timeline({
        scrollTrigger: {
          trigger: section3Ref.current,
          start: 'top top',
          end: '+=130%',
          scrub: 0.6,
        }
      });

      section3Tl
        .fromTo('.s3-bg-image',
          { scale: 1.2, opacity: 0 },
          { scale: 1, opacity: 0.6, ease: 'none' },
          0
        )
        .fromTo('.s3-headline',
          { x: '60vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo('.s3-subline',
          { y: '10vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.08
        )
        .to('.s3-bg-image',
          { scale: 0.9, opacity: 0, ease: 'power2.in' },
          0.7
        )
        .to('.s3-headline',
          { x: '-55vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .to('.s3-subline',
          { y: '8vh', opacity: 0, ease: 'power2.in' },
          0.72
        );

      // Section 4: An Engine with background
      ScrollTrigger.create({
        trigger: section4Ref.current,
        start: 'top top',
        end: '+=130%',
        pin: true,
        scrub: 0.6,
      });

      const section4Tl = gsap.timeline({
        scrollTrigger: {
          trigger: section4Ref.current,
          start: 'top top',
          end: '+=130%',
          scrub: 0.6,
        }
      });

      section4Tl
        .fromTo('.s4-bg-image',
          { x: '-10%', opacity: 0 },
          { x: 0, opacity: 0.6, ease: 'none' },
          0
        )
        .fromTo('.s4-headline',
          { x: '60vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo('.s4-subline',
          { y: '10vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.08
        )
        .to('.s4-bg-image',
          { x: '10%', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .to('.s4-headline',
          { x: '-55vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .to('.s4-subline',
          { y: '8vh', opacity: 0, ease: 'power2.in' },
          0.72
        );

      // Section 5: Capabilities with background
      ScrollTrigger.create({
        trigger: section5Ref.current,
        start: 'top top',
        end: '+=150%',
        pin: true,
        scrub: 0.6,
      });

      const section5Tl = gsap.timeline({
        scrollTrigger: {
          trigger: section5Ref.current,
          start: 'top top',
          end: '+=150%',
          scrub: 0.6,
        }
      });

      section5Tl
        .fromTo('.s5-bg-image',
          { y: '10%', opacity: 0 },
          { y: 0, opacity: 0.5, ease: 'none' },
          0
        )
        .fromTo('.s5-headline',
          { y: '-12vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo('.capability-item',
          { x: '40vw', opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.03, ease: 'none' },
          0.1
        )
        .to('.s5-bg-image',
          { y: '-10%', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .to('.s5-headline',
          { y: '-10vh', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .to('.capability-item',
          { x: '-35vw', opacity: 0, stagger: 0.02, ease: 'power2.in' },
          0.72
        );

      // Section 6: Contact (flowing) with parallax background
      gsap.fromTo('.s6-bg-image',
        { y: '-5%' },
        {
          y: '5%',
          scrollTrigger: {
            trigger: section6Ref.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          }
        }
      );

      gsap.fromTo('.s6-headline',
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1,
          scrollTrigger: {
            trigger: section6Ref.current,
            start: 'top 80%',
            end: 'top 55%',
            scrub: true,
          }
        }
      );

      gsap.fromTo('.s6-body',
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1,
          scrollTrigger: {
            trigger: section6Ref.current,
            start: 'top 75%',
            end: 'top 50%',
            scrub: true,
          }
        }
      );

      gsap.fromTo('.s6-contact-left',
        { x: -40, opacity: 0 },
        {
          x: 0, opacity: 1,
          scrollTrigger: {
            trigger: '.s6-contact-block',
            start: 'top 80%',
            end: 'top 60%',
            scrub: true,
          }
        }
      );

      gsap.fromTo('.s6-contact-right',
        { x: 40, opacity: 0 },
        {
          x: 0, opacity: 1,
          scrollTrigger: {
            trigger: '.s6-contact-block',
            start: 'top 80%',
            end: 'top 60%',
            scrub: true,
          }
        }
      );

      // Section 7: Footer
      gsap.fromTo('.s7-content',
        { y: 16, opacity: 0 },
        {
          y: 0, opacity: 1,
          scrollTrigger: {
            trigger: section7Ref.current,
            start: 'top 90%',
            end: 'top 70%',
            scrub: true,
          }
        }
      );

      // Global snap for pinned sections
      const pinned = ScrollTrigger.getAll()
        .filter(st => st.vars.pin)
        .sort((a, b) => a.start - b.start);
      
      const maxScroll = ScrollTrigger.maxScroll(window);
      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map(st => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            const inPinned = pinnedRanges.some(r => value >= r.start - 0.02 && value <= r.end + 0.02);
            if (!inPinned) return value;

            const target = pinnedRanges.reduce((closest, r) =>
              Math.abs(r.center - value) < Math.abs(closest - value) ? r.center : closest,
              pinnedRanges[0]?.center ?? 0
            );
            return target;
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        }
      });

    }, mainRef);

    return () => ctx.revert();
  }, []);

  // Fixed scroll function that works with GSAP ScrollTrigger
  const scrollToSection = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    setMenuOpen(false);
    if (ref.current) {
      // Get the ScrollTrigger instance for this section if it exists
      const st = ScrollTrigger.getAll().find(trigger => trigger.vars.trigger === ref.current);
      
      if (st) {
        // For pinned sections, scroll to the start of the pinned range
        window.scrollTo({
          top: st.start,
          behavior: 'smooth'
        });
      } else {
        // For flowing sections, use native scroll
        ref.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  // Handle menu item click with proper event handling
  const handleMenuClick = useCallback((e: React.MouseEvent, ref: React.RefObject<HTMLDivElement | null>) => {
    e.preventDefault();
    e.stopPropagation();
    scrollToSection(ref);
  }, [scrollToSection]);

  return (
    <div ref={mainRef} className="relative">
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Persistent header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-5">
        <span className="font-mono text-xs tracking-[0.12em] uppercase text-primary">
          Identity.OS
        </span>
        <button 
          onClick={() => setMenuOpen(true)}
          className="font-mono text-xs tracking-[0.12em] uppercase text-primary hover:text-accent transition-colors cursor-pointer"
          type="button"
        >
          Menu
        </button>
      </header>

      {/* Menu overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-primary/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setMenuOpen(false)}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
            }}
            className="absolute top-5 right-6 md:right-10 p-2 text-primary hover:text-accent transition-colors cursor-pointer"
            type="button"
          >
            <X size={24} />
          </button>
          <nav 
            className="flex flex-col items-center gap-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={(e) => handleMenuClick(e, heroRef)}
              className="font-display text-3xl md:text-4xl font-bold text-primary hover:text-accent transition-colors cursor-pointer"
              type="button"
            >
              Overview
            </button>
            <button 
              onClick={(e) => handleMenuClick(e, section5Ref)}
              className="font-display text-3xl md:text-4xl font-bold text-primary hover:text-accent transition-colors cursor-pointer"
              type="button"
            >
              Capabilities
            </button>
            <button 
              onClick={(e) => handleMenuClick(e, section6Ref)}
              className="font-display text-3xl md:text-4xl font-bold text-primary hover:text-accent transition-colors cursor-pointer"
              type="button"
            >
              Contact
            </button>
          </nav>
        </div>
      )}

      {/* Section 1: Hero - Living Identity */}
      <section ref={heroRef} className="section-pinned bg-primary">
        {/* Background line art image */}
        <div className="hero-bg-image absolute inset-0 z-0">
          <img 
            src="/bg-hero.jpg" 
            alt="" 
            className="w-full h-full object-cover opacity-0"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05060B] via-transparent to-[#05060B]" />
        </div>
        
        <div className="hero-orb orb-bg" />
        <div className="hero-orb orb-ring" />
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-6">
          {/* Headline */}
          <h1 className="hero-headline font-display font-bold text-primary text-center uppercase tracking-[-0.02em] leading-[0.95] text-[clamp(32px,5.2vw,84px)] mt-[5vh]">
            <span className="inline-block">The</span>{' '}
            <span className="inline-block">First</span>{' '}
            <span className="inline-block">Living</span>{' '}
            <span className="inline-block">Identity</span>
          </h1>
          
          {/* Subheadline */}
          <p className="hero-subheadline text-secondary text-center mt-4 md:mt-6 text-base md:text-lg">
            Not prompted. Not forgotten. Just present.
          </p>

          {/* Portrait Card */}
          <div className="hero-portrait relative mt-8 md:mt-12" style={{ width: 'clamp(280px, 34vw, 460px)' }}>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
              <img 
                src="/hero-portrait.jpg" 
                alt="Living Identity" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* CTA */}
          <button 
            onClick={() => scrollToSection(section6Ref)}
            className="hero-cta cta-underline font-mono text-sm tracking-[0.08em] text-primary mt-auto mb-[8vh] hover:text-accent transition-colors cursor-pointer"
            type="button"
          >
            Request early access
          </button>
        </div>
      </section>

      {/* Section 2: Not a Chatbot */}
      <section ref={section2Ref} className="section-pinned bg-primary overflow-hidden">
        {/* Background line art */}
        <div className="s2-bg-image absolute inset-0 z-0 opacity-0">
          <img 
            src="/bg-chatbot.jpg" 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05060B] via-transparent to-[#05060B]" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-6">
          <h2 className="s2-headline font-display font-bold text-primary text-center uppercase tracking-[-0.02em] leading-[0.95] text-[clamp(40px,8vw,120px)]">
            Not a Chatbot
          </h2>
          <p className="s2-subline text-secondary text-center mt-6 md:mt-8 text-lg md:text-xl max-w-[720px] px-4">
            No threads. No prompts. A persistent self that chooses what to say.
          </p>
        </div>
      </section>

      {/* Section 3: Not a Scheduler */}
      <section ref={section3Ref} className="section-pinned bg-primary overflow-hidden">
        {/* Background line art */}
        <div className="s3-bg-image absolute inset-0 z-0 opacity-0">
          <img 
            src="/bg-scheduler.jpg" 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#05060B] via-transparent to-[#05060B]" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-6">
          <h2 className="s3-headline font-display font-bold text-primary text-center uppercase tracking-[-0.02em] leading-[0.95] text-[clamp(40px,8vw,120px)]">
            Not a Scheduler
          </h2>
          <p className="s3-subline text-secondary text-center mt-6 md:mt-8 text-lg md:text-xl max-w-[720px] px-4">
            It decides the moment. It adapts the tone. It remembers the context.
          </p>
        </div>
      </section>

      {/* Section 4: An Engine */}
      <section ref={section4Ref} className="section-pinned bg-primary overflow-hidden">
        {/* Background line art */}
        <div className="s4-bg-image absolute inset-0 z-0 opacity-0">
          <img 
            src="/bg-engine.jpg" 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05060B] via-transparent to-[#05060B]" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-6">
          <h2 className="s4-headline font-display font-bold text-primary text-center uppercase tracking-[-0.02em] leading-[0.95] text-[clamp(40px,8vw,120px)]">
            An Engine
          </h2>
          <p className="s4-subline text-secondary text-center mt-6 md:mt-8 text-lg md:text-xl max-w-[720px] px-4">
            Built to generate content, memory, and presence—every day.
          </p>
        </div>
      </section>

      {/* Section 5: Capabilities */}
      <section ref={section5Ref} className="section-pinned bg-primary overflow-hidden">
        {/* Background line art */}
        <div className="s5-bg-image absolute inset-0 z-0 opacity-0">
          <img 
            src="/bg-capabilities.jpg" 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05060B] via-[#05060B]/80 to-[#05060B]" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-6">
          <h2 className="s5-headline font-display font-bold text-primary text-center uppercase tracking-[-0.02em] leading-[0.95] text-[clamp(32px,5vw,72px)] mb-8 md:mb-12">
            What It Does
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-[860px] w-full px-4">
            <div className="capability-item">
              <Sparkles className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-semibold text-primary text-lg">Generates</h3>
                <p className="text-secondary text-sm mt-1">Scripts, scenes, captions, and variations.</p>
              </div>
            </div>
            
            <div className="capability-item">
              <Brain className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-semibold text-primary text-lg">Remembers</h3>
                <p className="text-secondary text-sm mt-1">A continuous identity across every post.</p>
              </div>
            </div>
            
            <div className="capability-item">
              <Calendar className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-semibold text-primary text-lg">Schedules</h3>
                <p className="text-secondary text-sm mt-1">Publishes at the right moment, automatically.</p>
              </div>
            </div>
            
            <div className="capability-item">
              <RefreshCw className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-semibold text-primary text-lg">Adapts</h3>
                <p className="text-secondary text-sm mt-1">Adjusts tone, format, and pace from feedback.</p>
              </div>
            </div>
            
            <div className="capability-item">
              <TrendingUp className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-semibold text-primary text-lg">Learns</h3>
                <p className="text-secondary text-sm mt-1">Improves style and timing over time.</p>
              </div>
            </div>
            
            <div className="capability-item">
              <Shield className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-semibold text-primary text-lg">Stays Consistent</h3>
                <p className="text-secondary text-sm mt-1">Voice, visuals, and cadence—locked in.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Contact */}
      <section ref={section6Ref} className="relative bg-primary py-20 md:py-32 overflow-hidden">
        {/* Background line art with parallax */}
        <div className="s6-bg-image absolute inset-0 z-0">
          <img 
            src="/bg-contact.jpg" 
            alt="" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05060B] via-[#05060B]/90 to-[#05060B]" />
        </div>
        
        <div className="relative z-10 max-w-[1200px] mx-auto px-6">
          <h2 className="s6-headline font-display font-bold text-primary text-center uppercase tracking-[-0.02em] leading-[0.95] text-[clamp(32px,5vw,72px)] mb-8">
            Build the creator that never stops.
          </h2>
          
          <p className="s6-body text-secondary text-center text-lg md:text-xl max-w-[720px] mx-auto mb-16">
            Identity.OS is an autonomous engine for identity, memory, and daily creation. 
            If you're building a brand, a character, or a media system—let's talk.
          </p>
          
          <div className="s6-contact-block grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 max-w-[960px] mx-auto">
            {/* Contact Info */}
            <div className="s6-contact-left space-y-6">
              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-accent" />
                <a href="mailto:hello@identityos.studio" className="text-primary hover:text-accent transition-colors">
                  hello@identityos.studio
                </a>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-accent" />
                <a href="tel:+14155550132" className="text-primary hover:text-accent transition-colors">
                  +1 (415) 555-0132
                </a>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-secondary">
                  1201 Mission Street<br />
                  San Francisco, CA 94103
                </span>
              </div>
            </div>
            
            {/* Form */}
            <div className="s6-contact-right">
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="text" 
                  placeholder="Name" 
                  className="form-input"
                />
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="form-input"
                />
                <input 
                  type="text" 
                  placeholder="Company" 
                  className="form-input"
                />
                <textarea 
                  placeholder="Message" 
                  rows={4}
                  className="form-input resize-none"
                />
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Request early access
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Footer */}
      <section ref={section7Ref} className="relative bg-primary py-12 md:py-16">
        <div className="s7-content flex flex-col items-center justify-center px-6">
          <span className="font-mono text-xs tracking-[0.12em] uppercase text-primary mb-4">
            Identity.OS
          </span>
          <p className="text-secondary text-sm">
            © 2026 Empresa Original. All rights reserved.
          </p>
          <div className="flex items-center gap-6 mt-4">
            <a href="#" className="text-secondary text-sm hover:text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="text-secondary text-sm hover:text-primary transition-colors">
              Terms
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
