import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonIOException;
import com.google.gson.JsonParseException;
import com.mojang.datafixers.DataFixer;
import com.mojang.logging.LogUtils;
import com.mojang.serialization.Codec;
import com.mojang.serialization.JsonOps;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;
import java.util.function.BiConsumer;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;

public class anb {
   private static final Logger a = LogUtils.getLogger();
   private static final Gson b = (new GsonBuilder()).setPrettyPrinting().create();
   private final bbz c;
   private final Path d;
   private ah e;
   private final Map<ac, ae> f = new LinkedHashMap();
   private final Set<ac> g = new HashSet();
   private final Set<ac> h = new HashSet();
   private final Set<ad> i = new HashSet();
   private axg j;
   @Nullable
   private ac k;
   private boolean l = true;
   private final Codec<anb.a> m;

   public anb(DataFixer $$0, bbz $$1, ang $$2, Path $$3, axg $$4) {
      this.c = $$1;
      this.d = $$3;
      this.j = $$4;
      this.e = $$2.a();
      int $$5 = true;
      this.m = bhz.s.a((Codec)anb.a.a, (DataFixer)$$0, 1343);
      this.d($$2);
   }

   public void a(axg $$0) {
      this.j = $$0;
   }

   public void a() {
      Iterator var1 = mi.ak.iterator();

      while(var1.hasNext()) {
         am<?> $$0 = (am)var1.next();
         $$0.a(this);
      }

   }

   public void a(ang $$0) {
      this.a();
      this.f.clear();
      this.g.clear();
      this.i.clear();
      this.h.clear();
      this.l = true;
      this.k = null;
      this.e = $$0.a();
      this.d($$0);
   }

   private void b(ang $$0) {
      Iterator var2 = $$0.b().iterator();

      while(var2.hasNext()) {
         ac $$1 = (ac)var2.next();
         this.d($$1);
      }

   }

   private void c(ang $$0) {
      Iterator var2 = $$0.b().iterator();

      while(var2.hasNext()) {
         ac $$1 = (ac)var2.next();
         ab $$2 = $$1.b();
         if ($$2.e().isEmpty()) {
            this.a($$1, "");
            $$2.d().a(this.j);
         }
      }

   }

   private void d(ang $$0) {
      if (Files.isRegularFile(this.d, new LinkOption[0])) {
         try {
            BufferedReader $$1 = Files.newBufferedReader(this.d, StandardCharsets.UTF_8);

            try {
               JsonElement $$2 = bhf.a((Reader)$$1);
               anb.a $$3 = (anb.a)this.m.parse(JsonOps.INSTANCE, $$2).getOrThrow(JsonParseException::new);
               this.a($$0, $$3);
            } catch (Throwable var6) {
               if ($$1 != null) {
                  try {
                     $$1.close();
                  } catch (Throwable var5) {
                     var6.addSuppressed(var5);
                  }
               }

               throw var6;
            }

            if ($$1 != null) {
               $$1.close();
            }
         } catch (JsonIOException | IOException var7) {
            a.error("Couldn't access player advancements in {}", this.d, var7);
         } catch (JsonParseException var8) {
            a.error("Couldn't parse player advancements in {}", this.d, var8);
         }
      }

      this.c($$0);
      this.b($$0);
   }

   public void b() {
      JsonElement $$0 = (JsonElement)this.m.encodeStart(JsonOps.INSTANCE, this.c()).getOrThrow();

      try {
         bfp.c(this.d.getParent());
         BufferedWriter $$1 = Files.newBufferedWriter(this.d, StandardCharsets.UTF_8);

         try {
            b.toJson($$0, b.newJsonWriter($$1));
         } catch (Throwable var6) {
            if ($$1 != null) {
               try {
                  $$1.close();
               } catch (Throwable var5) {
                  var6.addSuppressed(var5);
               }
            }

            throw var6;
         }

         if ($$1 != null) {
            $$1.close();
         }
      } catch (JsonIOException | IOException var7) {
         a.error("Couldn't save player advancements to {}", this.d, var7);
      }

   }

   private void a(ang $$0, anb.a $$1) {
      $$1.a(($$1x, $$2) -> {
         ac $$3 = $$0.a($$1x);
         if ($$3 == null) {
            a.warn("Ignored advancement '{}' in progress file {} - it doesn't exist anymore?", $$1x, this.d);
         } else {
            this.a($$3, $$2);
            this.h.add($$3);
            this.c($$3);
         }
      });
   }

   private anb.a c() {
      Map<amo, ae> $$0 = new LinkedHashMap();
      this.f.forEach(($$1, $$2) -> {
         if ($$2.b()) {
            $$0.put($$1.a(), $$2);
         }

      });
      return new anb.a($$0);
   }

   public boolean a(ac $$0, String $$1) {
      boolean $$2 = false;
      ae $$3 = this.b($$0);
      boolean $$4 = $$3.a();
      if ($$3.a($$1)) {
         this.e($$0);
         this.h.add($$0);
         $$2 = true;
         if (!$$4 && $$3.a()) {
            $$0.b().d().a(this.j);
            $$0.b().c().ifPresent(($$1x) -> {
               if ($$1x.i() && (Boolean)this.j.A().U().a(eua.S)) {
                  this.c.a($$1x.e().a($$0, this.j), false);
               }

            });
         }
      }

      if (!$$4 && $$3.a()) {
         this.c($$0);
      }

      return $$2;
   }

   public boolean b(ac $$0, String $$1) {
      boolean $$2 = false;
      ae $$3 = this.b($$0);
      boolean $$4 = $$3.a();
      if ($$3.b($$1)) {
         this.d($$0);
         this.h.add($$0);
         $$2 = true;
      }

      if ($$4 && !$$3.a()) {
         this.c($$0);
      }

      return $$2;
   }

   private void c(ac $$0) {
      ad $$1 = this.e.a($$0);
      if ($$1 != null) {
         this.i.add($$1.d());
      }

   }

   private void d(ac $$0) {
      ae $$1 = this.b($$0);
      if (!$$1.a()) {
         Iterator var3 = $$0.b().e().entrySet().iterator();

         while(var3.hasNext()) {
            Entry<String, ak<?>> $$2 = (Entry)var3.next();
            al $$3 = $$1.c((String)$$2.getKey());
            if ($$3 != null && !$$3.a()) {
               this.a($$0, (String)$$2.getKey(), (ak)$$2.getValue());
            }
         }

      }
   }

   private <T extends an> void a(ac $$0, String $$1, ak<T> $$2) {
      $$2.a().a(this, new am.a($$2.b(), $$0, $$1));
   }

   private void e(ac $$0) {
      ae $$1 = this.b($$0);
      Iterator var3 = $$0.b().e().entrySet().iterator();

      while(true) {
         Entry $$2;
         al $$3;
         do {
            do {
               if (!var3.hasNext()) {
                  return;
               }

               $$2 = (Entry)var3.next();
               $$3 = $$1.c((String)$$2.getKey());
            } while($$3 == null);
         } while(!$$3.a() && !$$1.a());

         this.b($$0, (String)$$2.getKey(), (ak)$$2.getValue());
      }
   }

   private <T extends an> void b(ac $$0, String $$1, ak<T> $$2) {
      $$2.a().b(this, new am.a($$2.b(), $$0, $$1));
   }

   public void a(axg $$0, boolean $$1) {
      if (this.l || !this.i.isEmpty() || !this.h.isEmpty()) {
         Map<amo, ae> $$2 = new HashMap();
         Set<ac> $$3 = new HashSet();
         Set<amo> $$4 = new HashSet();
         Iterator var6 = this.i.iterator();

         while(var6.hasNext()) {
            ad $$5 = (ad)var6.next();
            this.a((ad)$$5, (Set)$$3, (Set)$$4);
         }

         this.i.clear();
         var6 = this.h.iterator();

         while(var6.hasNext()) {
            ac $$6 = (ac)var6.next();
            if (this.g.contains($$6)) {
               $$2.put($$6.a(), (ae)this.f.get($$6));
            }
         }

         this.h.clear();
         if (!$$2.isEmpty() || !$$3.isEmpty() || !$$4.isEmpty()) {
            $$0.g.b((aay)(new aht(this.l, $$3, $$4, $$2, $$1)));
         }
      }

      this.l = false;
   }

   public void a(@Nullable ac $$0) {
      ac $$1 = this.k;
      if ($$0 != null && $$0.b().a() && $$0.b().c().isPresent()) {
         this.k = $$0;
      } else {
         this.k = null;
      }

      if ($$1 != this.k) {
         this.j.g.b((aay)(new agb(this.k == null ? null : this.k.a())));
      }

   }

   public ae b(ac $$0) {
      ae $$1 = (ae)this.f.get($$0);
      if ($$1 == null) {
         $$1 = new ae();
         this.a($$0, $$1);
      }

      return $$1;
   }

   private void a(ac $$0, ae $$1) {
      $$1.a($$0.b().f());
      this.f.put($$0, $$1);
   }

   private void a(ad $$0, Set<ac> $$1, Set<amo> $$2) {
      ant.a($$0, ($$0x) -> {
         return this.b($$0x.b()).a();
      }, ($$2x, $$3) -> {
         ac $$4 = $$2x.b();
         if ($$3) {
            if (this.g.add($$4)) {
               $$1.add($$4);
               if (this.f.containsKey($$4)) {
                  this.h.add($$4);
               }
            }
         } else if (this.g.remove($$4)) {
            $$2.add($$4.a());
         }

      });
   }

   static record a(Map<amo, ae> b) {
      public static final Codec<anb.a> a;

      a(Map<amo, ae> param1) {
         this.b = $$0;
      }

      public void a(BiConsumer<amo, ae> $$0) {
         this.b.entrySet().stream().sorted(Entry.comparingByValue()).forEach(($$1) -> {
            $$0.accept((amo)$$1.getKey(), (ae)$$1.getValue());
         });
      }

      public Map<amo, ae> a() {
         return this.b;
      }

      static {
         a = Codec.unboundedMap(amo.a, ae.a).xmap(anb.a::new, anb.a::a);
      }
   }
}
