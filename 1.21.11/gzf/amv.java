import amv.1;
import com.mojang.logging.LogUtils;
import java.io.PrintStream;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Function;
import java.util.function.Supplier;
import org.slf4j.Logger;

@x(
   a = "System.out setup"
)
public class amv {
   public static final PrintStream a;
   private static volatile boolean c;
   private static final Logger d;
   public static final AtomicLong b;

   public static void a() {
      if (!c) {
         c = true;
         Instant $$0 = Instant.now();
         if (mi.aR.i().isEmpty()) {
            throw new IllegalStateException("Unable to load registries");
         } else {
            ecv.b();
            ebc.b();
            if (cgu.a(cgu.cb) == null) {
               throw new IllegalStateException("Failed loading EntityTypes");
            } else {
               gy.a();
               lg.a();
               ka.a();
               mi.a();
               dkl.a();
               d();
               b.set(Duration.between($$0, Instant.now()).toMillis());
            }
         }
      }
   }

   private static <T> void a(Iterable<T> $$0, Function<T, String> $$1, Set<String> $$2) {
      uu $$3 = uu.a();
      $$0.forEach(($$3x) -> {
         String $$4 = (String)$$1.apply($$3x);
         if (!$$3.b($$4)) {
            $$2.add($$4);
         }

      });
   }

   private static void a(Set<String> $$0) {
      uu $$1 = uu.a();
      eua $$2 = new eua(dhb.e.a());
      $$2.a((etz)(new 1($$1, $$0)));
   }

   public static Set<String> b() {
      Set<String> $$0 = new TreeSet();
      a(mi.t, cin::c, $$0);
      a(mi.g, cgu::g, $$0);
      a(mi.d, cfk::f, $$0);
      a(mi.h, dlp::j, $$0);
      a(mi.e, eog::z, $$0);
      a(mi.l, ($$0x) -> {
         String var10000 = $$0x.toString();
         return "stat." + var10000.replace(':', '.');
      }, $$0);
      a((Set)$$0);
      return $$0;
   }

   public static void a(Supplier<String> $$0) {
      if (!c) {
         throw b($$0);
      }
   }

   private static RuntimeException b(Supplier<String> $$0) {
      try {
         String $$1 = (String)$$0.get();
         return new IllegalArgumentException("Not bootstrapped (called from " + $$1 + ")");
      } catch (Exception var3) {
         RuntimeException $$3 = new IllegalArgumentException("Not bootstrapped (failed to resolve location)");
         $$3.addSuppressed(var3);
         return $$3;
      }
   }

   public static void c() {
      a(() -> {
         return "validate";
      });
      if (w.aX) {
         b().forEach(($$0) -> {
            d.error("Missing translations: {}", $$0);
         });
         ee.b();
      }

      cit.a();
   }

   private static void d() {
      if (d.isDebugEnabled()) {
         System.setErr(new amy("STDERR", System.err));
         System.setOut(new amy("STDOUT", a));
      } else {
         System.setErr(new ana("STDERR", System.err));
         System.setOut(new ana("STDOUT", a));
      }

   }

   public static void a(String $$0) {
      a.println($$0);
   }

   static {
      a = System.out;
      d = LogUtils.getLogger();
      b = new AtomicLong(-1L);
   }
}
