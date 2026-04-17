import { Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { take } from 'rxjs';
import { Router } from '@angular/router';
import { AccountService } from '../account/account.service';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SportEvent {
  date: string;
  title: string;
  description: string;
  location: string;
}

interface Team {
  logo: string;
  name: string;
  sport: string;
}

interface Result {
  teams: string;
  date: string;
  score: string;
}

interface SportCategory {
  logo: string;
  name: string;
  sport: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  showBackToTop = false;

  // Calendar properties
  currentDate = new Date();
  currentMonth = 5; // June (0-indexed, so 5 = June)
  currentYear = 2026;
  eventDays = [1, 2]; // Days with events in June
  dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // Data properties
  upcomingEvents: SportEvent[] = [
    {
      date: 'June 1, 2026',
      title: 'Love Boracay 2026',
      description: 'Maya\'s Boracay, Station 1, White Beach, Boracay Island',
      location: 'Maya\'s Boracay, Station 1, White Beach, Boracay Island'
    },
    {
      date: 'June 2, 2026',
      title: 'Love Boracay 2026',
      description: 'Maya\'s Boracay, Station 1, White Beach, Boracay Island',
      location: 'Maya\'s Boracay, Station 1, White Beach, Boracay Island'
    }
  ];

  pastEvents: SportEvent[] = [
    {
      date: 'May 28, 2025',
      title: 'Spring Championship',
      description: 'An amazing tournament that saw record-breaking performances and unforgettable moments.',
      location: 'Olympic Stadium'
    },
    {
      date: 'May 15, 2025',
      title: 'Regional Qualifiers',
      description: 'Teams battled for their spot in the championship with incredible displays of skill.',
      location: 'Sports Complex North'
    }
  ];

  teams: Team[] = [
    { logo: 'TH', name: 'Thunder Hawks', sport: 'Basketball' },
    { logo: 'FE', name: 'Fire Eagles', sport: 'Football' },
    { logo: 'SS', name: 'Storm Sharks', sport: 'Swimming' },
    { logo: 'GL', name: 'Green Lions', sport: 'Soccer' },
    { logo: 'SW', name: 'Silver Wolves', sport: 'Hockey' },
    { logo: 'GR', name: 'Golden Raptors', sport: 'Tennis' }
  ];

  results: Result[] = [
    { teams: 'Thunder Hawks vs Fire Eagles', date: 'June 5, 2025', score: '89-76' },
    { teams: 'Green Lions vs Silver Wolves', date: 'June 3, 2025', score: '3-1' },
    { teams: 'Storm Sharks vs Golden Raptors', date: 'June 1, 2025', score: '2-0' },
    { teams: 'Fire Eagles vs Green Lions', date: 'May 30, 2025', score: '4-2' }
  ];

  sportsCategories: SportCategory[] = [
    { logo: '🏀', name: 'Basketball', sport: 'Fast-paced court action' },
    { logo: '⚽', name: 'Soccer', sport: 'The beautiful game' },
    { logo: '🏈', name: 'Football', sport: 'American football' },
    { logo: '🏊', name: 'Swimming', sport: 'Aquatic excellence' },
    { logo: '🏒', name: 'Hockey', sport: 'Ice hockey thrills' },
    { logo: '🎾', name: 'Tennis', sport: 'Precision and power' }
  ];

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private accountService: AccountService,
    private router: Router
  ) {}

  ngOnInit() {
    this.accountService.user$.pipe(take(1)).subscribe(user => {
      if (user?.role === 'Student') {
        this.router.navigateByUrl('/exams');
      }
    });

    this.setupInteractiveEffects();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Show/hide back to top button based on scroll position
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.showBackToTop = scrollPosition > 300;
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  ngAfterViewInit() {
    this.initScrollAnimations();
  }

  ngOnDestroy() {
    // Kill all ScrollTrigger instances
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }

  private initScrollAnimations() {
    // Hero section animation
    gsap.fromTo('.hero-content h1', 
      { opacity: 0, y: 50 },
      {
        scrollTrigger: {
          trigger: '.hero',
          start: 'top 80%',
          toggleActions: 'play reverse play reverse'
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
      }
    );

    gsap.fromTo('.hero-content p',
      { opacity: 0, y: 30 },
      {
        scrollTrigger: {
          trigger: '.hero',
          start: 'top 80%',
          toggleActions: 'play reverse play reverse'
        },
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.2,
        ease: 'power3.out'
      }
    );

    gsap.fromTo('.cta-buttons',
      { opacity: 0, y: 30 },
      {
        scrollTrigger: {
          trigger: '.hero',
          start: 'top 80%',
          toggleActions: 'play reverse play reverse'
        },
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.4,
        ease: 'power3.out'
      }
    );

    // Events section animation
    gsap.fromTo('.events-section',
      { opacity: 0, y: 50 },
      {
        scrollTrigger: {
          trigger: '.events-section',
          start: 'top 80%',
          toggleActions: 'play reverse play reverse'
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
      }
    );

    gsap.fromTo('.calendar',
      { opacity: 0, x: -50 },
      {
        scrollTrigger: {
          trigger: '.calendar',
          start: 'top 80%',
          toggleActions: 'play reverse play reverse'
        },
        opacity: 1,
        x: 0,
        duration: 1,
        ease: 'power3.out'
      }
    );

    gsap.fromTo('.events-content',
      { opacity: 0, x: 50 },
      {
        scrollTrigger: {
          trigger: '.events-content',
          start: 'top 80%',
          toggleActions: 'play reverse play reverse'
        },
        opacity: 1,
        x: 0,
        duration: 1,
        ease: 'power3.out'
      }
    );

    // Set initial state for event cards
    gsap.set('.event-card', { opacity: 0, y: 30 });
    
    // Animate event cards in
    gsap.to('.event-card', {
      scrollTrigger: {
        trigger: '.events-content',
        start: 'top 80%',
        toggleActions: 'play reverse play reverse'
      },
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power3.out'
    });

    // Partnership section animation
    gsap.fromTo('.partnership-section',
      { opacity: 0, y: 50 },
      {
        scrollTrigger: {
          trigger: '.partnership-section',
          start: 'top 80%',
          toggleActions: 'play reverse play reverse'
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
      }
    );

    // Set initial state for partner cards
    gsap.set('.partner-card', { opacity: 0, scale: 0.8 });
    
    // Animate partner cards in
    gsap.to('.partner-card', {
      scrollTrigger: {
        trigger: '.partners-grid',
        start: 'top 80%',
        toggleActions: 'play reverse play reverse'
      },
      opacity: 1,
      scale: 1,
      duration: 0.8,
      stagger: 0.1,
      ease: 'back.out(1.7)'
    });

    // Sponsorship section animation
    gsap.fromTo('.sponsorship-section',
      { opacity: 0, y: 50 },
      {
        scrollTrigger: {
          trigger: '.sponsorship-section',
          start: 'top 80%',
          toggleActions: 'play reverse play reverse'
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
      }
    );

    gsap.fromTo('.logo-tile',
      { opacity: 0, scale: 0.5 },
      {
        scrollTrigger: {
          trigger: '.marquee-wrapper',
          start: 'top 80%',
          toggleActions: 'play reverse play reverse'
        },
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.05,
        ease: 'back.out(1.7)'
      }
    );

    // Feedback section animation
    gsap.fromTo('.feedback-section',
      { opacity: 0, y: 50 },
      {
        scrollTrigger: {
          trigger: '.feedback-section',
          start: 'top 80%',
          toggleActions: 'play reverse play reverse'
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
      }
    );

    // Set initial state for feedback cards
    gsap.set('.feedback-card', { opacity: 0, y: 40 });
    
    // Animate feedback cards in
    gsap.to('.feedback-card', {
      scrollTrigger: {
        trigger: '.feedback-grid',
        start: 'top 80%',
        toggleActions: 'play reverse play reverse'
      },
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    });

    // Footer animation
    gsap.fromTo('footer',
      { opacity: 0, y: 50 },
      {
        scrollTrigger: {
          trigger: 'footer',
          start: 'top 90%',
          toggleActions: 'play reverse play reverse'
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
      }
    );
  }

  // Calendar methods
  getCurrentMonthYear(): string {
    return `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
  }

  getEmptyDays(): number[] {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    return Array(firstDay).fill(0);
  }

  getPreviousMonthDays(index: number): number {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInPreviousMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
    return daysInPreviousMonth - firstDay + index + 1;
  }

  getRemainingDays(): number[] {
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const lastDayOfWeek = lastDay.getDay();
    const daysInMonth = lastDay.getDate();
    const remaining = 6 - lastDayOfWeek;
    return remaining > 0 ? Array.from({ length: remaining }, (_, i) => i + 1) : [];
  }

  getEventMonth(dateString: string): string {
    try {
      const date = new Date(dateString);
      return this.monthNames[date.getMonth()].toLowerCase();
    } catch {
      return 'june';
    }
  }

  getEventDays(dateString: string): string {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      // For Love Boracay 2026 event (June 1 & 2), return "1 & 2"
      if (date.getMonth() === 5 && (day === 1 || day === 2) && date.getFullYear() === 2026) {
        return '1 & 2';
      }
      return day.toString();
    } catch {
      return '1 & 2';
    }
  }

  getDaysInMonth(): number[] {
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }

  changeMonth(direction: number) {
    this.currentMonth += direction;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
  }

  isToday(day: number): boolean {
    const today = new Date();
    return day === today.getDate() && 
           this.currentMonth === today.getMonth() && 
           this.currentYear === today.getFullYear();
  }

  hasEvent(day: number): boolean {
    return this.currentMonth === 5 && // June
           this.currentYear === 2026 && 
           this.eventDays.includes(day);
  }

  onDayClick(day: number) {
    if (this.hasEvent(day)) {
      this.showEventNotification(day);
    }
  }

  // Scroll and animation methods
  scrollToSection(event: MouseEvent, sectionId: string) {
    event.preventDefault();
    const target = document.getElementById(sectionId);
    if (target) {
      const headerHeight = 80;
      const targetPosition = target.offsetTop - headerHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }


  private setupInteractiveEffects() {
    // Add hover effects to cards
    const cards = this.elementRef.nativeElement.querySelectorAll('.event-card, .team-card, .result-item');
    cards.forEach((card: HTMLElement) => {
      this.renderer.listen(card, 'mouseenter', () => {
        const transform = card.classList.contains('result-item') ? 
          'translateX(15px) scale(1.02)' : 'translateY(-15px) scale(1.02)';
        this.renderer.setStyle(card, 'transform', transform);
      });
      
      this.renderer.listen(card, 'mouseleave', () => {
        const transform = card.classList.contains('result-item') ? 
          'translateX(0) scale(1)' : 'translateY(0) scale(1)';
        this.renderer.setStyle(card, 'transform', transform);
      });
    });

    // Add CTA button animation
    const ctaButton = this.elementRef.nativeElement.querySelector('.cta-button');
    if (ctaButton) {
      this.renderer.listen(ctaButton, 'click', (e) => {
        this.renderer.setStyle(ctaButton, 'transform', 'scale(0.95)');
        setTimeout(() => {
          this.renderer.setStyle(ctaButton, 'transform', 'translateY(-5px) scale(1.05)');
        }, 100);
      });
    }
  }

  private showEventNotification(day: number) {
    const notification = this.renderer.createElement('div');
    this.renderer.setProperty(notification, 'textContent', `Event scheduled on ${day}!`);
    
    const notificationStyles = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #228B22, #32CD32);
      color: white;
      padding: 15px 25px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(34, 139, 34, 0.3);
      z-index: 10000;
      font-weight: bold;
      animation: slideIn 0.3s ease-out;
    `;
    
    this.renderer.setAttribute(notification, 'style', notificationStyles);
    
    // Add slide-in animation
    const style = this.renderer.createElement('style');
    this.renderer.setProperty(style, 'textContent', `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `);
    
    this.renderer.appendChild(document.head, style);
    this.renderer.appendChild(document.body, notification);
    
    setTimeout(() => {
      this.renderer.removeChild(document.body, notification);
      this.renderer.removeChild(document.head, style);
    }, 3000);
  }

}
