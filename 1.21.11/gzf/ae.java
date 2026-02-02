import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.Map.Entry;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;

public class ae implements Comparable<ae> {
   private static final DateTimeFormatter b;
   private static final Codec<Instant> c;
   private static final Codec<Map<String, al>> d;
   public static final Codec<ae> a;
   private final Map<String, al> e;
   private af f;

   private ae(Map<String, al> $$0) {
      this.f = af.b;
      this.e = $$0;
   }

   public ae() {
      this.f = af.b;
      this.e = Maps.newHashMap();
   }

   public void a(af $$0) {
      Set<String> $$1 = $$0.c();
      this.e.entrySet().removeIf(($$1x) -> {
         return !$$1.contains($$1x.getKey());
      });
      Iterator var3 = $$1.iterator();

      while(var3.hasNext()) {
         String $$2 = (String)var3.next();
         this.e.putIfAbsent($$2, new al());
      }

      this.f = $$0;
   }

   public boolean a() {
      return this.f.a(this::d);
   }

   public boolean b() {
      Iterator var1 = this.e.values().iterator();

      al $$0;
      do {
         if (!var1.hasNext()) {
            return false;
         }

         $$0 = (al)var1.next();
      } while(!$$0.a());

      return true;
   }

   public boolean a(String $$0) {
      al $$1 = (al)this.e.get($$0);
      if ($$1 != null && !$$1.a()) {
         $$1.b();
         return true;
      } else {
         return false;
      }
   }

   public boolean b(String $$0) {
      al $$1 = (al)this.e.get($$0);
      if ($$1 != null && $$1.a()) {
         $$1.c();
         return true;
      } else {
         return false;
      }
   }

   public String toString() {
      String var10000 = String.valueOf(this.e);
      return "AdvancementProgress{criteria=" + var10000 + ", requirements=" + String.valueOf(this.f) + "}";
   }

   public void a(wx $$0) {
      $$0.a(this.e, wx::a, ($$0x, $$1) -> {
         $$1.a($$0x);
      });
   }

   public static ae b(wx $$0) {
      Map<String, al> $$1 = $$0.a(wx::p, al::b);
      return new ae($$1);
   }

   @Nullable
   public al c(String $$0) {
      return (al)this.e.get($$0);
   }

   private boolean d(String $$0) {
      al $$1 = this.c($$0);
      return $$1 != null && $$1.a();
   }

   public float c() {
      if (this.e.isEmpty()) {
         return 0.0F;
      } else {
         float $$0 = (float)this.f.a();
         float $$1 = (float)this.h();
         return $$1 / $$0;
      }
   }

   @Nullable
   public yh d() {
      if (this.e.isEmpty()) {
         return null;
      } else {
         int $$0 = this.f.a();
         if ($$0 <= 1) {
            return null;
         } else {
            int $$1 = this.h();
            return yh.a("advancements.progress", $$1, $$0);
         }
      }
   }

   private int h() {
      return this.f.b(this::d);
   }

   public Iterable<String> e() {
      List<String> $$0 = Lists.newArrayList();
      Iterator var2 = this.e.entrySet().iterator();

      while(var2.hasNext()) {
         Entry<String, al> $$1 = (Entry)var2.next();
         if (!((al)$$1.getValue()).a()) {
            $$0.add((String)$$1.getKey());
         }
      }

      return $$0;
   }

   public Iterable<String> f() {
      List<String> $$0 = Lists.newArrayList();
      Iterator var2 = this.e.entrySet().iterator();

      while(var2.hasNext()) {
         Entry<String, al> $$1 = (Entry)var2.next();
         if (((al)$$1.getValue()).a()) {
            $$0.add((String)$$1.getKey());
         }
      }

      return $$0;
   }

   @Nullable
   public Instant g() {
      return (Instant)this.e.values().stream().map(al::d).filter(Objects::nonNull).min(Comparator.naturalOrder()).orElse((Object)null);
   }

   public int a(ae $$0) {
      Instant $$1 = this.g();
      Instant $$2 = $$0.g();
      if ($$1 == null && $$2 != null) {
         return 1;
      } else if ($$1 != null && $$2 == null) {
         return -1;
      } else {
         return $$1 == null && $$2 == null ? 0 : $$1.compareTo($$2);
      }
   }

   // $FF: synthetic method
   public int compareTo(final Object param1) {
      return this.a((ae)var1);
   }

   static {
      b = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss Z", Locale.ROOT);
      c = bfm.a(b).xmap(Instant::from, ($$0) -> {
         return $$0.atZone(ZoneId.systemDefault());
      });
      d = Codec.unboundedMap(Codec.STRING, c).xmap(($$0) -> {
         return bhs.a($$0, al::new);
      }, ($$0) -> {
         return (Map)$$0.entrySet().stream().filter(($$0x) -> {
            return ((al)$$0x.getValue()).a();
         }).collect(Collectors.toMap(Entry::getKey, ($$0x) -> {
            return (Instant)Objects.requireNonNull(((al)$$0x.getValue()).d());
         }));
      });
      a = RecordCodecBuilder.create(($$0) -> {
         return $$0.group(d.optionalFieldOf("criteria", Map.of()).forGetter(($$0x) -> {
            return $$0x.e;
         }), Codec.BOOL.fieldOf("done").orElse(true).forGetter(ae::a)).apply($$0, ($$0x, $$1) -> {
            return new ae(new HashMap($$0x));
         });
      });
   }
}
