import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9_-]{0,119}$/, "slug must match ^[a-z0-9][a-z0-9_-]{0,119}$");

export const pixelTypeSchema = z.enum(["meta", "tiktok", "google", "postback"]);
export const adminPixelTypeSchema = z.union([pixelTypeSchema, z.literal("none")]);

export const pixelConfigSchema = z.object({
  id: z.string().min(1, "pixel_config.id is required"),
  token: z.string().optional(),
  event_name: z.string().min(1, "pixel_config.event_name is required").default("PageView"),
  custom_params: z.record(z.union([z.string(), z.number(), z.boolean()])).optional()
});

export const adminLoginSchema = z.object({
  password: z.string().min(1, "password is required")
});

export const redirectRuleInputSchema = z
  .object({
    slug: slugSchema,
    target_url: z.string().url("target_url must be a valid URL"),
    status_code: z.union([z.literal(301), z.literal(302)]).default(302),
    is_active: z.boolean().default(true),
    pixel_enabled: z.boolean().default(false),
    pixel_type: adminPixelTypeSchema.nullable().optional().default("none"),
    pixel_config: z.unknown().nullable().optional()
  })
  .superRefine((value, ctx) => {
    if (!value.pixel_enabled && value.pixel_config) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pixel_enabled"],
        message: "pixel_config must be omitted when pixel_enabled is false"
      });
    }
  });
