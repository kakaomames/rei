import amp.1;
import com.google.gson.JsonElement;
import com.mojang.logging.LogUtils;
import com.mojang.serialization.Codec;
import com.mojang.serialization.DataResult;
import com.mojang.serialization.Decoder;
import com.mojang.serialization.DynamicOps;
import com.mojang.serialization.JsonOps;
import com.mojang.serialization.Lifecycle;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.Reader;
import java.io.StringWriter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Map.Entry;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;

public class amp {
   private static final Logger d = LogUtils.getLogger();
   private static final Comparator<amt<?>> e = Comparator.comparing(amt::b).thenComparing(amt::a);
   private static final jp f = new jp(Optional.empty(), Lifecycle.experimental());
   private static final Function<Optional<bag>, jp> g = bhs.b(($$0) -> {
      Lifecycle $$1 = (Lifecycle)$$0.map(bag::a).map(($$0x) -> {
         return Lifecycle.stable();
      }).orElse(Lifecycle.experimental());
      return new jp($$0, $$1);
   });
   public static final List<amp.d<?>> a;
   public static final List<amp.d<?>> b;
   public static final List<amp.d<?>> c;

   public static jr.b a(baz $$0, List<jf.b<?>> $$1, List<amp.d<?>> $$2) {
      return a(($$1x, $$2x) -> {
         $$1x.a($$0, $$2x);
      }, $$1, $$2);
   }

   public static jr.b a(Map<amt<? extends jq<?>>, amp.c> $$0, bbc $$1, List<jf.b<?>> $$2, List<amp.d<?>> $$3) {
      return a(($$2x, $$3x) -> {
         $$2x.a($$0, $$1, $$3x);
      }, $$2, $$3);
   }

   private static jr.b a(amp.b $$0, List<jf.b<?>> $$1, List<amp.d<?>> $$2) {
      Map<amt<?>, Exception> $$3 = new HashMap();
      List<amp.a<?>> $$4 = (List)$$2.stream().map(($$1x) -> {
         return $$1x.a(Lifecycle.stable(), $$3);
      }).collect(Collectors.toUnmodifiableList());
      ams.c $$5 = a($$1, $$4);
      $$4.forEach(($$2x) -> {
         $$0.apply($$2x, $$5);
      });
      $$4.forEach(($$1x) -> {
         jz $$2 = $$1x.b();

         try {
            $$2.n();
         } catch (Exception var4) {
            $$3.put($$2.g(), var4);
         }

         if ($$1x.a.c && $$2.d() == 0) {
            $$3.put($$2.g(), new IllegalStateException("Registry must be non-empty: " + String.valueOf($$2.g().a())));
         }

      });
      if (!$$3.isEmpty()) {
         throw a((Map)$$3);
      } else {
         return (new jr.c($$4.stream().map(amp.a::b).toList())).e();
      }
   }

   private static ams.c a(List<jf.b<?>> $$0, List<amp.a<?>> $$1) {
      Map<amt<? extends jq<?>>, ams.b<?>> $$2 = new HashMap();
      $$0.forEach(($$1x) -> {
         $$2.put($$1x.g(), a($$1x));
      });
      $$1.forEach(($$1x) -> {
         $$2.put($$1x.b.g(), a($$1x.b));
      });
      return new 1($$2);
   }

   private static <T> ams.b<T> a(jz<T> $$0) {
      return new ams.b($$0, $$0.p(), $$0.h());
   }

   private static <T> ams.b<T> a(jf.b<T> $$0) {
      return new ams.b($$0, $$0, $$0.h());
   }

   private static v a(Map<amt<?>, Exception> $$0) {
      b($$0);
      return c($$0);
   }

   private static void b(Map<amt<?>, Exception> $$0) {
      StringWriter $$1 = new StringWriter();
      PrintWriter $$2 = new PrintWriter($$1);
      Map<amo, Map<amo, Exception>> $$3 = (Map)$$0.entrySet().stream().collect(Collectors.groupingBy(($$0x) -> {
         return ((amt)$$0x.getKey()).b();
      }, Collectors.toMap(($$0x) -> {
         return ((amt)$$0x.getKey()).a();
      }, Entry::getValue)));
      $$3.entrySet().stream().sorted(Entry.comparingByKey()).forEach(($$1x) -> {
         $$2.printf(Locale.ROOT, "> Errors in registry %s:%n", $$1x.getKey());
         ((Map)$$1x.getValue()).entrySet().stream().sorted(Entry.comparingByKey()).forEach(($$1) -> {
            $$2.printf(Locale.ROOT, ">> Errors in element %s:%n", $$1.getKey());
            ((Exception)$$1.getValue()).printStackTrace($$2);
         });
      });
      $$2.flush();
      d.error("Registry loading errors:\n{}", $$1);
   }

   private static v c(Map<amt<?>, Exception> $$0) {
      m $$1 = m.a((Throwable)(new IllegalStateException("Failed to load registries due to errors")), (String)"Registry Loading");
      n $$2 = $$1.a("Loading info");
      $$2.a("Errors", () -> {
         StringBuilder $$1 = new StringBuilder();
         $$0.entrySet().stream().sorted(Entry.comparingByKey(e)).forEach(($$1x) -> {
            $$1.append("\n\t\t").append(((amt)$$1x.getKey()).b()).append("/").append(((amt)$$1x.getKey()).a()).append(": ").append(((Exception)$$1x.getValue()).getMessage());
         });
         return $$1.toString();
      });
      return new v($$1);
   }

   private static <E> void a(jz<E> $$0, Decoder<E> $$1, ams<JsonElement> $$2, amt<E> $$3, bax $$4, jp $$5) throws IOException {
      BufferedReader $$6 = $$4.e();

      try {
         JsonElement $$7 = bhf.a((Reader)$$6);
         DataResult<E> $$8 = $$1.parse($$2, $$7);
         E $$9 = $$8.getOrThrow();
         $$0.a($$3, $$9, $$5);
      } catch (Throwable var11) {
         if ($$6 != null) {
            try {
               $$6.close();
            } catch (Throwable var10) {
               var11.addSuppressed(var10);
            }
         }

         throw var11;
      }

      if ($$6 != null) {
         $$6.close();
      }

   }

   static <E> void a(baz $$0, ams.c $$1, jz<E> $$2, Decoder<E> $$3, Map<amt<?>, Exception> $$4) {
      amm $$5 = amm.a($$2.g());
      ams<JsonElement> $$6 = ams.a((DynamicOps)JsonOps.INSTANCE, (ams.c)$$1);
      Iterator var7 = $$5.a($$0).entrySet().iterator();

      while(var7.hasNext()) {
         Entry<amo, bax> $$7 = (Entry)var7.next();
         amo $$8 = (amo)$$7.getKey();
         amt<E> $$9 = amt.a($$2.g(), $$5.b($$8));
         bax $$10 = (bax)$$7.getValue();
         jp $$11 = (jp)g.apply($$10.c());

         try {
            a($$2, $$3, $$6, $$9, $$10, $$11);
         } catch (Exception var14) {
            $$4.put($$9, new IllegalStateException(String.format(Locale.ROOT, "Failed to parse %s from pack %s", $$8, $$10.b()), var14));
         }
      }

      beg.a($$0, $$2);
   }

   static <E> void a(Map<amt<? extends jq<?>>, amp.c> $$0, bbc $$1, ams.c $$2, jz<E> $$3, Decoder<E> $$4, Map<amt<?>, Exception> $$5) {
      amp.c $$6 = (amp.c)$$0.get($$3.g());
      if ($$6 != null) {
         ams<vz> $$7 = ams.a((DynamicOps)vn.a, (ams.c)$$2);
         ams<JsonElement> $$8 = ams.a((DynamicOps)JsonOps.INSTANCE, (ams.c)$$2);
         amm $$9 = amm.a($$3.g());
         Iterator var10 = $$6.a.iterator();

         while(var10.hasNext()) {
            ju.a $$10 = (ju.a)var10.next();
            amt<E> $$11 = amt.a($$3.g(), $$10.a());
            Optional<vz> $$12 = $$10.b();
            if ($$12.isPresent()) {
               try {
                  DataResult<E> $$13 = $$4.parse($$7, (vz)$$12.get());
                  E $$14 = $$13.getOrThrow();
                  $$3.a($$11, $$14, f);
               } catch (Exception var16) {
                  $$5.put($$11, new IllegalStateException(String.format(Locale.ROOT, "Failed to parse value %s from server", $$12.get()), var16));
               }
            } else {
               amo $$16 = $$9.a($$10.a());

               try {
                  bax $$17 = $$1.getResourceOrThrow($$16);
                  a($$3, $$4, $$8, $$11, $$17, f);
               } catch (Exception var17) {
                  $$5.put($$11, new IllegalStateException("Failed to parse local data", var17));
               }
            }
         }

         beg.a($$6.b, $$3);
      }
   }

   static {
      a = List.of(new amp.d[]{new amp.d(mj.bd, esh.h), new amp.d(mj.aS, dxo.a), new amp.d(mj.aU, yd.a), new amp.d(mj.aX, ewu.a), new amp.d(mj.aY, exi.a), new amp.d(mj.bp, fes.a), new amp.d(mj.bs, ffo.a), new amp.d(mj.br, ffu.a), new amp.d(mj.bq, fjp.c), new amp.d(mj.bt, fgy.a), new amp.d(mj.bl, euv.a), new amp.d(mj.bm, fke.a.a), new amp.d(mj.bb, euj.c), new amp.d(mj.bD, ffd.a), new amp.d(mj.bg, fdp.a), new amp.d(mj.bA, dut.a), new amp.d(mj.bz, dur.a), new amp.d(mj.bx, eni.b), new amp.d(mj.bB, cxx.a, true), new amp.d(mj.bC, cxv.a, true), new amp.d(mj.bo, cxc.a, true), new amp.d(mj.bh, cvs.a, true), new amp.d(mj.aT, cvc.a, true), new amp.d(mj.aZ, cui.a, true), new amp.d(mj.aV, cud.a, true), new amp.d(mj.aW, cws.a, true), new amp.d(mj.bn, czh.a, true), new amp.d(mj.ba, cez.a), new amp.d(mj.bk, dyc.a), new amp.d(mj.aR, ekq.a), new amp.d(mj.bf, dso.b), new amp.d(mj.be, dtz.a), new amp.d(mj.bj, dlz.a), new amp.d(mj.bi, dlm.a), new amp.d(mj.bu, tv.a), new amp.d(mj.bv, tb.b), new amp.d(mj.bc, asj.c), new amp.d(mj.bw, fvn.b)});
      b = List.of(new amp.d(mj.bF, esi.a));
      c = List.of(new amp.d[]{new amp.d(mj.aS, dxo.b), new amp.d(mj.aU, yd.a), new amp.d(mj.bA, dut.a), new amp.d(mj.bz, dur.a), new amp.d(mj.bB, cxx.b, true), new amp.d(mj.bC, cxv.b, true), new amp.d(mj.bo, cxc.b, true), new amp.d(mj.bh, cvs.b, true), new amp.d(mj.aT, cvc.b, true), new amp.d(mj.aZ, cui.b, true), new amp.d(mj.aV, cud.b, true), new amp.d(mj.aW, cws.b, true), new amp.d(mj.bn, czh.a, true), new amp.d(mj.bd, esh.i), new amp.d(mj.ba, cez.a), new amp.d(mj.aR, ekq.a), new amp.d(mj.bf, dso.b), new amp.d(mj.bj, dlz.a), new amp.d(mj.bi, dlm.a), new amp.d(mj.bu, tv.a), new amp.d(mj.bv, tb.b), new amp.d(mj.bc, asj.c), new amp.d(mj.bw, fvn.c)});
   }

   @FunctionalInterface
   interface b {
      void apply(amp.a<?> var1, ams.c var2);
   }

   public static record c(List<ju.a> a, beh.a b) {
      final List<ju.a> a;
      final beh.a b;

      public c(List<ju.a> param1, beh.a param2) {
         this.a = $$0;
         this.b = $$1;
      }

      public List<ju.a> a() {
         return this.a;
      }

      public beh.a b() {
         return this.b;
      }
   }

   private static record a<T>(amp.d<T> a, jz<T> b, Map<amt<?>, Exception> c) {
      final amp.d<T> a;
      final jz<T> b;

      a(amp.d<T> param1, jz<T> param2, Map<amt<?>, Exception> param3) {
         this.a = $$0;
         this.b = $$1;
         this.c = $$2;
      }

      public void a(baz $$0, ams.c $$1) {
         amp.a($$0, $$1, this.b, this.a.b, this.c);
      }

      public void a(Map<amt<? extends jq<?>>, amp.c> $$0, bbc $$1, ams.c $$2) {
         amp.a((Map)$$0, (bbc)$$1, (ams.c)$$2, (jz)this.b, (Decoder)this.a.b, (Map)this.c);
      }

      public amp.d<T> a() {
         return this.a;
      }

      public jz<T> b() {
         return this.b;
      }

      public Map<amt<?>, Exception> c() {
         return this.c;
      }
   }

   public static record d<T>(amt<? extends jq<T>> a, Codec<T> b, boolean c) {
      final Codec<T> b;
      final boolean c;

      d(amt<? extends jq<T>> $$0, Codec<T> $$1) {
         this($$0, $$1, false);
      }

      public d(amt<? extends jq<T>> param1, Codec<T> param2, boolean param3) {
         this.a = $$0;
         this.b = $$1;
         this.c = $$2;
      }

      amp.a<T> a(Lifecycle $$0, Map<amt<?>, Exception> $$1) {
         jz<T> $$2 = new jl(this.a, $$0);
         return new amp.a(this, $$2, $$1);
      }

      public void a(BiConsumer<amt<? extends jq<T>>, Codec<T>> $$0) {
         $$0.accept(this.a, this.b);
      }

      public amt<? extends jq<T>> a() {
         return this.a;
      }

      public Codec<T> b() {
         return this.b;
      }

      public boolean c() {
         return this.c;
      }
   }
}
