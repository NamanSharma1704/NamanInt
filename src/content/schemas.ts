import { z } from 'zod';
export const schemas = {
  pages: {
    home: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "description": z.string(),
        "primaryCta": z.string(),
        "secondaryCta": z.string(),
        "reachLabel": z.string()
      }),
      "proof": z.object({
        "items": z.array(z.object({
          "label": z.string(),
          "title": z.string(),
          "text": z.string(),
          "id": z.string()
        }))
      }),
      "services": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "items": z.array(z.object({
          "title": z.string(),
          "text": z.string(),
          "image": z.string(),
          "id": z.string()
        }))
      }),
      "network": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "text": z.string(),
        "routeStatement": z.string(),
        "origin": z.string(),
        "destination": z.string()
      }),
      "cta": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "text": z.string(),
        "button": z.string()
      })
    }),
    trade_services: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "text": z.string(),
        "cta": z.string()
      }),
      "framework": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "text": z.string()
      }),
      "services": z.array(z.object({
        "title": z.string(),
        "number": z.string(),
        "text": z.string(),
        "image": z.string(),
        "id": z.string()
      })),
      "principles": z.object({
        "eyebrow": z.string(),
        "items": z.array(z.object({
          "title": z.string(),
          "text": z.string(),
          "id": z.string()
        }))
      }),
      "cta": z.object({
        "title": z.string(),
        "text": z.string(),
        "button": z.string()
      })
    }),
    categories: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "text": z.string(),
        "cta": z.string()
      }),
      "intro": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "text": z.string()
      }),
      "categories": z.array(z.object({
        "title": z.string(),
        "number": z.string(),
        "text": z.string(),
        "detail": z.string(),
        "image": z.string(),
        "id": z.string()
      })),
      "note": z.object({
        "label": z.string(),
        "title": z.string(),
        "text": z.string()
      }),
      "cta": z.object({
        "title": z.string(),
        "text": z.string(),
        "button": z.string()
      })
    }),
    company: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "text": z.string(),
        "cta": z.string()
      }),
      "story": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "text": z.string()
      }),
      "standards": z.object({
        "eyebrow": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "number": z.string(),
          "title": z.string(),
          "text": z.string()
        }))
      }),
      "network": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "text": z.string(),
        "caption": z.string()
      }),
      "cta": z.object({
        "title": z.string(),
        "text": z.string(),
        "button": z.string()
      })
    }),
    contact: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "text": z.string()
      }),
      "form": z.object({
        "title": z.string(),
        "text": z.string(),
        "submit": z.string(),
        "success": z.string(),
        "fields": z.object({
          "name": z.string(),
          "email": z.string(),
          "company": z.string(),
          "market": z.string(),
          "category": z.string(),
          "volume": z.string(),
          "message": z.string()
        })
      }),
      "offices": z.object({
        "title": z.string(),
        "shenzhen": z.object({
          "label": z.string(),
          "addressEnglish": z.string(),
          "addressChinese": z.string(),
          "phone": z.string()
        }),
        "hongKong": z.object({
          "label": z.string(),
          "addressEnglish": z.string(),
          "addressChinese": z.string(),
          "phone": z.string(),
          "fax": z.string()
        }),
        "usa": z.object({
          "label": z.string(),
          "addressEnglish": z.string()
        }),
        "manchester": z.object({
          "label": z.string(),
          "addressEnglish": z.string()
        })
      })
    })
  },
  site: z.object({
    "contact": z.object({
      "addressChinese": z.string(),
      "addressEnglish": z.string(),
      "hongKongOffice": z.object({
        "addressChinese": z.string(),
        "addressEnglish": z.string(),
        "fax": z.string(),
        "phone": z.string()
      }),
      "phone": z.string(),
      "email": z.string(),
      "usaOffice": z.object({
        "addressEnglish": z.string()
      }),
      "manchesterOffice": z.object({
        "addressEnglish": z.string()
      })
    }),
    "footer": z.object({
      "summary": z.string(),
      "tagline": z.string()
    })
  })
};
export type Schemas = typeof schemas;