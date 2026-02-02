import it.unimi.dsi.fastutil.objects.Object2IntLinkedOpenHashMap;
import it.unimi.dsi.fastutil.objects.Object2IntMaps;
import it.unimi.dsi.fastutil.objects.ObjectIterator;
import it.unimi.dsi.fastutil.objects.Object2IntMap.Entry;
import java.util.Iterator;
import java.util.Queue;

public class anp {
   private static final int a = 8;
   private final Queue<anp.a> b = new beo();
   private final Object2IntLinkedOpenHashMap<anp.b> c = new Object2IntLinkedOpenHashMap();

   private static long b() {
      return System.currentTimeMillis();
   }

   public synchronized void a(String $$0, Throwable $$1) {
      long $$2 = b();
      String $$3 = $$1.getMessage();
      this.b.add(new anp.a($$2, $$0, $$1.getClass(), $$3));

      while(this.b.size() > 8) {
         this.b.remove();
      }

      anp.b $$4 = new anp.b($$0, $$1.getClass());
      int $$5 = this.c.getInt($$4);
      this.c.putAndMoveToFirst($$4, $$5 + 1);
   }

   public synchronized String a() {
      long $$0 = b();
      StringBuilder $$1 = new StringBuilder();
      if (!this.b.isEmpty()) {
         $$1.append("\n\t\tLatest entries:\n");
         Iterator var4 = this.b.iterator();

         while(var4.hasNext()) {
            anp.a $$2 = (anp.a)var4.next();
            $$1.append("\t\t\t").append($$2.b).append(":").append($$2.c).append(": ").append($$2.d).append(" (").append($$0 - $$2.a).append("ms ago)").append("\n");
         }
      }

      if (!this.c.isEmpty()) {
         if ($$1.isEmpty()) {
            $$1.append("\n");
         }

         $$1.append("\t\tEntry counts:\n");
         ObjectIterator var6 = Object2IntMaps.fastIterable(this.c).iterator();

         while(var6.hasNext()) {
            Entry<anp.b> $$3 = (Entry)var6.next();
            $$1.append("\t\t\t").append(((anp.b)$$3.getKey()).a).append(":").append(((anp.b)$$3.getKey()).b).append(" x ").append($$3.getIntValue()).append("\n");
         }
      }

      return $$1.isEmpty() ? "~~NONE~~" : $$1.toString();
   }

   static record a(long a, String b, Class<? extends Throwable> c, String d) {
      final long a;
      final String b;
      final Class<? extends Throwable> c;
      final String d;

      a(long param1, String param3, Class<? extends Throwable> param4, String param5) {
         this.a = $$0;
         this.b = $$1;
         this.c = $$2;
         this.d = $$3;
      }

      public long a() {
         return this.a;
      }

      public String b() {
         return this.b;
      }

      public Class<? extends Throwable> c() {
         return this.c;
      }

      public String d() {
         return this.d;
      }
   }

   static record b(String a, Class<? extends Throwable> b) {
      final String a;
      final Class<? extends Throwable> b;

      b(String param1, Class<? extends Throwable> param2) {
         this.a = $$0;
         this.b = $$1;
      }

      public String a() {
         return this.a;
      }

      public Class<? extends Throwable> b() {
         return this.b;
      }
   }
}
