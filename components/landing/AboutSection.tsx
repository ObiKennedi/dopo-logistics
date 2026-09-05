"use client"

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '@/styles/landing/AboutSection.scss';

export const AboutSection = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      offset: 100,
    });
  }, []);

  return (
    <section className="about-section" id='about'>
      <div className="about-section__container">
        {/* Header */}
        <div className="about-section__header" data-aos="fade-up">
          <span className="about-section__badge">DOPO Logistics & Procurement</span>
          <h1 className="about-section__title">About DOPO</h1>
          <h2 className="about-section__subtitle">
            Making Everyday Tasks Easier. Getting Things Done.
          </h2>
        </div>

        {/* Content Grid */}
        <div className="about-section__grid">
          {/* Main Description */}
          <div className="about-section__content" data-aos="fade-right" data-aos-delay="100">
            <p className="about-section__lead">
              <strong>DOPO Logistics & Procurement</strong> is a modern logistics and procurement service built to take the stress out of everyday errands, deliveries, purchases, sourcing, and business support.
            </p>
            <p>
              We understand that time is valuable. Whether you need an item delivered across Owerri, something purchased on your behalf, a product sourced, prices checked across different markets, or an important errand handled, DOPO is here to get it done.
            </p>
            <p>
              Our services are designed for individuals, students, businesses, and organizations looking for a reliable partner they can trust with the tasks that keep their lives and operations moving.
            </p>
            <p>
              Starting from Owerri, Imo State, DOPO combines local knowledge, convenience, and professional service to make getting things done simpler. From a single personal errand to ongoing procurement and logistics support, we take responsibility from request to completion.
            </p>
          </div>

          {/* Feature Side Cards */}
          <div className="about-section__sidebar">
            {/* Approach Card */}
            <div className="about-section__card" data-aos="fade-left" data-aos-delay="200">
              <h3 className="about-section__card-title">Our Approach</h3>
              <p>
                We believe logistics should be more than simply moving things from one place to another.
              </p>
              <p>
                It’s about <strong>trust, communication, and responsibility</strong>.
              </p>
              <p>
                When you hand a task to DOPO, our job is to understand what you need, handle the details, and keep you informed along the way.
              </p>
              <div className="about-section__tagline">
                <span>You have things to do.</span>
                <strong>We'll handle the rest.</strong>
              </div>
            </div>

            {/* Mission Card */}
            <div className="about-section__card about-section__card--highlight" data-aos="fade-left" data-aos-delay="300">
              <h3 className="about-section__card-title">Our Mission</h3>
              <p>
                To make everyday logistics, procurement, and sourcing more accessible, convenient, and reliable for individuals and businesses—starting locally and building toward a wider network of service across Nigeria.
              </p>
              <div className="about-section__motto">
                Your Errand. Our Responsibility.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};