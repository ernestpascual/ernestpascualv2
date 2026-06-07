"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function ParticlesBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  if (!init) return null;

  return (
    <Particles
      id="tsparticles"
      options={{
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 120,
        interactivity: {
          events: {
            onClick: {
              enable: true,
              mode: "push",
            },
            onHover: {
              enable: true,
              mode: "repulse",
            },
            resize: {
              enable: true
            }
          },
          modes: {
            push: {
              quantity: 4,
            },
            repulse: {
              distance: 20,
              duration: 1,
            },
          },
        },
        particles: {
          color: {
            value: "#ffffff",
          },
          links: {
            enable: false,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "out",
            },
            random: true,
            speed: 0.2,
            straight: false,
          },
          number: {
            density: {
              enable: true,
            },
            value: 2500,
          },
          opacity: {
            value: { min: 0.2, max: 0.6 },
            animation: {
              enable: false,
            }
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 0.5, max: 1.0 },
          },
        },
        detectRetina: true,
      }}
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-auto"
    />
  );
}
