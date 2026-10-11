"use client";
import { BRAND } from "@/domain/brand";

import { SelectField, TextAreaField, TextField } from "@/components/admin/form-fields";
import { EVENT_STATUS_LABELS } from "@/domain/bout-enums";
import { MEDIA_SPECS } from "@/domain/media-specs";
import type { TicketTier } from "@/db/schema/events";
import type { MediaDTO } from "@/features/media/dto";
import { MediaField } from "@/features/media/components/media-field";
import { MediaGalleryField } from "@/features/media/components/media-gallery-field";
import { TicketTiersField } from "./ticket-tiers-field";

/** Nombre, número y estado del evento. El enlace solo se edita en eventos ya creados. */
export function EventDataTab({ showSlug, isLive }: { showSlug: boolean; isLive: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField name="name" label="Nombre del evento" hint={`Ej.: ${BRAND.name} 5`} autoComplete="off" />
      <TextField name="number" label="Número (opcional)" inputMode="numeric" autoComplete="off" />
      <SelectField
        name="eventStatus"
        label="Estado del evento"
        hint="«En vivo» y «Finalizado» se ponen solos desde Noche de pelea; aquí puedes cancelar el evento o volver a programarlo."
      >
        <option value="scheduled">{EVENT_STATUS_LABELS.scheduled}</option>
        <option value="cancelled">{EVENT_STATUS_LABELS.cancelled}</option>
        <option value="completed">{EVENT_STATUS_LABELS.completed}</option>
        {isLive ? <option value="live">{EVENT_STATUS_LABELS.live}</option> : null}
      </SelectField>
      {showSlug ? (
        <TextField
          name="slug"
          label="Enlace del evento"
          hint="Al renombrar el evento el enlace no cambia. Cámbialo solo si es necesario: los enlaces ya compartidos dejarían de funcionar."
          autoComplete="off"
          autoCapitalize="none"
        />
      ) : null}
    </div>
  );
}

/** Fecha y hora de inicio (hora de Chile), puertas, término estimado y recinto. */
export function EventPlaceTab() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField name="startsDate" label="Fecha del evento" type="date" />
      <TextField name="startsTime" label="Hora de inicio" type="time" hint="Hora de Chile." />
      <TextField name="doorsTime" label="Apertura de puertas (opcional)" type="time" />
      <TextField name="endsTime" label="Término estimado (opcional)" type="time" hint="Si es después de medianoche, se toma como el día siguiente." />
      <TextField name="venueName" label="Recinto" hint="Ej.: Arena Santiago" autoComplete="off" />
      <TextField name="venueCity" label="Ciudad" autoComplete="off" />
      <div className="md:col-span-2">
        <TextField name="venueAddress" label="Dirección" autoComplete="off" />
      </div>
      <div className="md:col-span-2">
        <TextField
          name="mapsUrl"
          label="Enlace de Google Maps (opcional)"
          hint="En Google Maps busca el recinto, toca «Compartir», copia el enlace y pégalo aquí. Con él se muestra el mapa en la página del evento."
          type="url"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
        />
      </div>
    </div>
  );
}

type EventImagesTabProps = { heroMedia: MediaDTO | null; heroMobileMedia: MediaDTO | null; posterMedia: MediaDTO | null; gallery: MediaDTO[] };

export function EventImagesTab({ heroMedia, heroMobileMedia, posterMedia, gallery }: EventImagesTabProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 md:grid-cols-2">
        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">{MEDIA_SPECS.event_hero.label}</h3>
          <p className="text-sm text-muted-foreground">Es la imagen grande de la página del evento en computador.</p>
          <MediaField kind="event_hero" name="heroMediaId" media={heroMedia} />
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">{MEDIA_SPECS.event_hero_mobile.label}</h3>
          <p className="text-sm text-muted-foreground">Se usa en celular; si falta, se usa la portada horizontal.</p>
          <MediaField kind="event_hero_mobile" name="heroMobileMediaId" media={heroMobileMedia} />
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">{MEDIA_SPECS.event_poster.label}</h3>
          <p className="text-sm text-muted-foreground">Aparece en los listados de eventos.</p>
          <MediaField kind="event_poster" name="posterMediaId" media={posterMedia} />
        </section>
      </div>
      <section className="flex flex-col gap-2">
        <h3 className="text-base font-semibold">Galería del evento</h3>
        <p className="text-sm text-muted-foreground">Fotos del evento (se pueden ordenar). Se muestran en la página pública, sobre todo después de la velada.</p>
        <MediaGalleryField name="galleryMediaIds" media={gallery} />
      </section>
    </div>
  );
}

type EventTicketsTabProps = { tiers: TicketTier[]; tiersError?: string };

export function EventTicketsTab({ tiers, tiersError }: EventTicketsTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="ticketUrl" label="Enlace de la ticketera" type="url" inputMode="url" hint="Donde se compran las entradas (https://…)." autoComplete="off" />
        <TextField name="ticketProvider" label="Nombre de la ticketera" hint="Ej.: Ticketmaster" autoComplete="off" />
      </div>
      <TicketTiersField initial={tiers} error={tiersError} />
      <TextAreaField name="ticketPoints" label="Puntos de venta" rows={3} maxLength={600} hint="Dónde comprar sin ticketera: boletería, tienda, etc." />
    </div>
  );
}
