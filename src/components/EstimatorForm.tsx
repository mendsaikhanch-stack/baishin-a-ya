"use client";

import { useState } from "react";
import type {
  EstimateInput,
  HouseType,
  Quality,
  Location,
  Floors,
} from "@/lib/estimator/types";

type Props = {
  onSubmit: (input: EstimateInput) => void | Promise<void>;
  loading?: boolean;
};

export default function EstimatorForm({ onSubmit, loading }: Props) {
  const [size, setSize] = useState(120);
  const [floors, setFloors] = useState<Floors>(1);
  const [type, setType] = useState<HouseType>("block");
  const [quality, setQuality] = useState<Quality>("medium");
  const [location, setLocation] = useState<Location>("city");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ size_m2: size, floors, type, quality, location });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md mx-auto bg-white rounded-xl border p-5"
    >
      <Field label="Талбай (м²)">
        <input
          type="number"
          min={20}
          max={2000}
          value={size}
          onChange={(e) => setSize(+e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
        />
      </Field>

      <Field label="Давхар">
        <select
          value={floors}
          onChange={(e) => setFloors(+e.target.value as Floors)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </Field>

      <Field label="Барилгын төрөл">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as HouseType)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="frame">Карказ</option>
          <option value="block">Блок</option>
          <option value="concrete">Цутгамал</option>
        </select>
      </Field>

      <Field label="Чанарын зэрэглэл">
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value as Quality)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="low">Хямд</option>
          <option value="medium">Дунд</option>
          <option value="high">Өндөр</option>
        </select>
      </Field>

      <Field label="Байршил">
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value as Location)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="city">Хот</option>
          <option value="rural">Хөдөө</option>
        </select>
      </Field>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50"
      >
        {loading ? "Тооцоолж байна..." : "Тооцоолох"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
